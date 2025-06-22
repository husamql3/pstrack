import { LeetcodeStatus } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod/v4'
import { redis } from '@/config/redis'
import { checkDuplicateUsername, checkPendingLeetcoder } from '@/dao/leetcoder.dao'
import { ADMINS_EMAILS, MAX_LEETCODERS, REDIS_KEYS } from '@/data/constants'
import { db } from '@/prisma/db'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { updateLeetcoderSchema } from '@/types/leetcoders.type'
import { checkGHUsername, checkLCUsername } from '@/utils/checkLeetcoder'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { sendRequestReceivedEmail } from '@/utils/email/sendRequestReceived'

export const leetcodersRouter = createTRPCRouter({
  /**
   * Retrieves a single Leetcoder by their unique ID.
   *
   * @param {object} input - The input object containing the Leetcoder's ID.
   * @param {string} input.id - The unique ID of the Leetcoder.
   * @returns {Promise<Leetcoder | null>} A promise that resolves to the Leetcoder object if found, otherwise null.
   */
  getLeetcoderById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    if (!input.id) return null
    return db.leetcoders.findUnique({
      where: { id: input.id },
    })
  }),

  /**
   * Retrieves a list of all Leetcoders.
   * This procedure is restricted to administrators only.
   *
   * @param {object} ctx - The tRPC context, containing user information.
   * @throws {TRPCError} If the authenticated user is not an admin.
   * @returns {Promise<Leetcoder[]>} A promise that resolves to an array of Leetcoder objects, ordered by creation date.
   */
  getAllLeetcoders: publicProcedure.query(async ({ ctx }) => {
    // Only allow access if the user is the admin
    if (ctx.user?.email && !ADMINS_EMAILS.includes(ctx.user.email)) {
      await sendAdminNotification({
        event: 'UNAUTHORIZED_ACCESS',
        email: ctx.user?.email || 'Unknown',
        message: 'Unauthorized attempt to access all leetcoders',
      })
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Only admin can access this resource',
      })
    }
    return db.leetcoders.findMany({
      orderBy: {
        created_at: 'desc',
      },
    })
  }),

  /**
   * Checks if a Leetcoder exists by their unique ID.
   *
   * @param {object} input - The input object containing the Leetcoder's ID.
   * @param {string} input.id - The unique ID of the Leetcoder.
   * @returns {Promise<boolean>} A promise that resolves to true if the Leetcoder exists, otherwise false.
   */
  checkLeetcoder: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    if (!input.id) return false
    const leetcoder = await db.leetcoders.findUnique({
      where: { id: input.id },
    })
    return !!leetcoder
  }),

  /**
   * Handles a new request for a user to join as a Leetcoder.
   * Performs validation checks for pending requests, duplicate usernames,
   * and external LeetCode/GitHub username validity. Creates a new Leetcoder entry
   * with PENDING status and sends out notifications.
   *
   * @param {object} input - The input object containing the new Leetcoder's details.
   * @param {string} input.name - The full name of the user.
   * @param {string} input.username - The chosen unique username for the platform.
   * @param {string} input.lc_username - The user's LeetCode username.
   * @param {string} [input.gh_username] - The user's GitHub username (optional).
   * @param {string} input.group_no - The group number the user wishes to join, transformed to a number.
   * @param {object} ctx - The tRPC context, containing authenticated user details.
   * @throws {TRPCError} If there's an existing pending request, duplicate username, invalid LeetCode/GitHub username,
   *                     or if a user with the same ID has already submitted a request.
   * @returns {Promise<Leetcoder>} A promise that resolves to the newly created Leetcoder object.
   */
  RequestToJoin: publicProcedure
    .input(
      z.object({
        name: z.string().min(3).max(100),
        username: z
          .string()
          .min(3, { message: 'Username must be at least 3 characters long' })
          .max(100)
          .refine((val) => !val.includes(' '), {
            message: 'Username cannot contain spaces',
          }),
        lc_username: z.string(),
        gh_username: z.string().optional(),
        group_no: z.string().transform((val) => Number(val)),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const pendingResult = await checkPendingLeetcoder(ctx?.user?.id as string)
      if (typeof pendingResult !== 'boolean' && !pendingResult.isValid) {
        await sendAdminNotification({
          event: 'JOIN_REQUEST_ERROR',
          email: ctx?.user?.email || 'Unknown',
          name: input.name,
          message: pendingResult.message,
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: pendingResult.message,
        })
      }

      // Check for duplicate usernames first to avoid unnecessary API calls
      const duplicateResult = await checkDuplicateUsername(input.username, input.lc_username)
      if (typeof duplicateResult !== 'boolean' && !duplicateResult.isValid) {
        await sendAdminNotification({
          event: 'JOIN_REQUEST_ERROR',
          email: ctx?.user?.email || 'Unknown',
          name: input.name,
          message: duplicateResult.message,
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: duplicateResult.message,
        })
      }

      // Run external API validations in parallel only if basic validations pass
      const validationPromises = [
        // Check LeetCode username
        checkLCUsername(input.lc_username),
        // Check GitHub username if provided, otherwise return true
        input.gh_username ? checkGHUsername(input.gh_username) : Promise.resolve(true),
      ]

      const [isLcValid, isGhValid] = await Promise.all(validationPromises)
      if (!isLcValid) {
        await sendAdminNotification({
          event: 'JOIN_REQUEST_ERROR',
          email: ctx?.user?.email || 'Unknown',
          name: input.name,
          leetcodeUsername: input.lc_username,
          message: 'Invalid LeetCode username',
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Hmm, that LeetCode username doesn't seem right. Please double-check it!",
        })
      }
      if (input.gh_username && !isGhValid) {
        await sendAdminNotification({
          event: 'JOIN_REQUEST_ERROR',
          email: ctx?.user?.email || 'Unknown',
          name: input.name,
          githubUsername: input.gh_username,
          message: 'Invalid GitHub username',
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The GitHub username looks invalid. Could you verify it?',
        })
      }

      try {
        const newLeetcoder = await db.leetcoders.create({
          data: {
            id: ctx?.user?.id as string,
            name: input.name,
            username: input.username,
            email: ctx?.user?.email as string,
            gh_username: input.gh_username,
            lc_username: input.lc_username,
            group_no: input.group_no,
            status: 'PENDING',
            avatar: ctx.user?.user_metadata?.avatar_url || null,
          },
        })

        await Promise.all([
          // Send notification to admin about new join request
          sendAdminNotification({
            event: 'NEW_JOIN_REQUEST',
            groupNo: input.group_no.toString(),
            username: input.username,
            name: input.name,
            email: ctx?.user?.email as string,
            leetcodeUsername: input.lc_username,
            githubUsername: input.gh_username || 'Not provided',
            timestamp: new Date().toISOString(),
          }),
          // Send notification to user about new join request
          sendRequestReceivedEmail({
            email: ctx?.user?.email as string,
          }),
          // Invalidate the cache
          redis.del(REDIS_KEYS.ALL_GROUPS_INFO),
          redis.del(REDIS_KEYS.AVAILABLE_GROUPS),
        ])

        return newLeetcoder
      } catch (error) {
        // Check if error is related to duplicate user ID
        if (error instanceof Error && error.message.includes('Unique constraint failed on the fields: (`id`)')) {
          await sendAdminNotification({
            event: 'JOIN_REQUEST_ERROR',
            username: ctx?.user?.email || 'Unknown',
            name: input.name,
            message: 'Duplicate user ID error',
          })
          throw new TRPCError({
            code: 'CONFLICT',
            message:
              'Your request to join is already submitted and waiting for approval. Please check back later for updates!',
          })
        }
        // Re-throw any other errors
        throw error
      }
    }),

  /**
   * Updates the status of a specific Leetcoder (e.g., PENDING, APPROVED, SUSPENDED).
   * This procedure is restricted to administrators only.
   *
   * @param {object} input - The input object containing the Leetcoder's ID and new status.
   * @param {string} input.id - The unique ID of the Leetcoder to update.
   * @param {LeetcodeStatus} input.status - The new status to set for the Leetcoder.
   * @param {object} ctx - The tRPC context, containing user information.
   * @throws {TRPCError} If the authenticated user is not an admin.
   * @returns {Promise<Leetcoder>} A promise that resolves to the updated Leetcoder object.
   */
  updateLeetcoderStatus: publicProcedure
    .input(z.object({ id: z.string().uuid(), status: z.nativeEnum(LeetcodeStatus) }))
    .mutation(async ({ input, ctx }) => {
      // Only allow access if the user is the admin
      if (ctx.user?.email && !ADMINS_EMAILS.includes(ctx.user.email)) {
        await sendAdminNotification({
          event: 'UNAUTHORIZED_ACCESS',
          username: ctx.user?.email || 'Unknown',
          message: 'Unauthorized attempt to update leetcoder status',
        })
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Only admin can access this resource',
        })
      }
      return db.leetcoders.update({
        where: { id: input.id },
        data: {
          status: input.status,
        },
      })
    }),

  /**
   * Deletes a Leetcoder entry from the database.
   * This procedure is restricted to administrators only.
   *
   * @param {object} input - The input object containing the Leetcoder's ID to delete.
   * @param {string} input.id - The unique ID of the Leetcoder to delete.
   * @param {object} ctx - The tRPC context, containing user information.
   * @throws {TRPCError} If the authenticated user is not an admin.
   * @returns {Promise<Leetcoder>} A promise that resolves to the deleted Leetcoder object.
   */
  deleteLeetcoder: publicProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ input, ctx }) => {
    // Only allow access if the user is the admin
    if (ctx.user?.email && !ADMINS_EMAILS.includes(ctx.user.email)) {
      await sendAdminNotification({
        event: 'UNAUTHORIZED_ACCESS',
        username: ctx.user?.email || 'Unknown',
        message: 'Unauthorized attempt to delete leetcoder',
      })
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Only admin can access this resource',
      })
    }
    return db.leetcoders.delete({
      where: { id: input.id },
    })
  }),

  /**
   * Changes the group number for a specific Leetcoder.
   * This procedure is restricted to administrators only and involves a database transaction
   * to update both the leetcoder's group and their associated submissions.
   *
   * @param {object} input - The input object containing the user ID and the new group number.
   * @param {string} input.userId - The unique ID of the Leetcoder whose group is to be changed.
   * @param {number} input.newGroupNo - The new group number to assign to the Leetcoder.
   * @param {object} ctx - The tRPC context, containing user information.
   * @throws {TRPCError} If the user is not found, already in the selected group, the group does not exist,
   *                     the selected group is full, or an internal server error occurs during the transaction.
   * @returns {Promise<Leetcoder>} A promise that resolves to the updated Leetcoder object.
   */
  changeGroup: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        newGroupNo: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, newGroupNo } = input
      const user = await db.leetcoders.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found.',
        })
      }

      if (user.group_no === newGroupNo) {
        await sendAdminNotification({
          event: 'GROUP_CHANGE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: `User is already in group ${newGroupNo}`,
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is already in the selected group.',
        })
      }

      const group = await db.groups.findUnique({
        where: { group_no: newGroupNo },
      })

      if (!group) {
        await sendAdminNotification({
          event: 'GROUP_CHANGE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: `Group ${newGroupNo} does not exist`,
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected group does not exist.',
        })
      }

      const count = await db.leetcoders.count({
        where: { group_no: newGroupNo },
      })

      if (count >= MAX_LEETCODERS) {
        await sendAdminNotification({
          event: 'GROUP_CHANGE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: `Group ${newGroupNo} is full`,
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected group is full.',
        })
      }

      try {
        const result = await db.$transaction(async (tx) => {
          await tx.submissions.updateMany({
            where: { user_id: userId },
            data: {
              solved: false,
              group_no: newGroupNo,
            },
          })

          await redis.del(REDIS_KEYS.ALL_GROUPS_INFO)
          return await tx.leetcoders.update({
            where: { id: userId },
            data: { group_no: newGroupNo },
          })
        })

        await sendAdminNotification({
          event: 'GROUP_CHANGE_SUCCESS',
          username: ctx?.user?.email || 'Unknown',
          message: `User ${user.username} changed from group ${user.group_no} to group ${newGroupNo}`,
        })

        return result
      } catch (error) {
        await sendAdminNotification({
          event: 'GROUP_CHANGE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: `Failed to change group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change group. Please try again later.',
        })
      }
    }),

  /**
   * Allows an authenticated Leetcoder to update their own profile information.
   * This includes optional fields like GitHub, X, LinkedIn usernames, website, and visibility.
   * Performs validation for duplicate and invalid GitHub usernames if changed.
   *
   * @param {object} input - The input object containing the Leetcoder's updated profile data.
   *                         Validated against `updateLeetcoderSchema`.
   * @param {object} ctx - The tRPC context, containing authenticated user details.
   * @throws {TRPCError} If the user is unauthorized (trying to update another user's profile),
   *                     if a GitHub username is already taken or invalid, or if an internal server error occurs.
   * @returns {Promise<Leetcoder>} A promise that resolves to the updated Leetcoder object.
   */
  update: publicProcedure.input(updateLeetcoderSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user?.id || !ctx.user.leetcoder || ctx.user.id !== input.id) {
      await sendAdminNotification({
        event: 'UNAUTHORIZED_ACCESS',
        username: ctx?.user?.email || 'Unknown',
        message: "Unauthorized attempt to update another user's profile",
      })
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You can only update your own profile',
      })
    }

    // Check if GitHub username has changed and validate if needed
    if (input.gh_username && input.gh_username !== ctx.user.leetcoder.gh_username) {
      const existingGhUser = await db.leetcoders.findFirst({
        where: {
          gh_username: input.gh_username,
          id: { not: input.id },
        },
      })
      if (existingGhUser) {
        await sendAdminNotification({
          event: 'PROFILE_UPDATE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: `GitHub username ${input.gh_username} is already registered by another user`,
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This GitHub username is already registered by another user',
        })
      }

      // Validate GitHub username exists
      const isGhValid = await checkGHUsername(input.gh_username)
      if (!isGhValid) {
        await sendAdminNotification({
          event: 'PROFILE_UPDATE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: `Invalid GitHub username: ${input.gh_username}`,
        })
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'The GitHub username looks invalid. Could you verify it?',
        })
      }
    }

    // Prepare update data
    const updateData = {
      gh_username: input.gh_username,
      x_username: input.x_username,
      li_username: input.li_username,
      website: input.website,
      is_visible: input.is_visible,
    }

    try {
      const result = await db.leetcoders.update({
        where: { id: input.id },
        data: updateData,
      })

      await sendAdminNotification({
        event: 'PROFILE_UPDATE_SUCCESS',
        username: ctx?.user?.email || 'Unknown',
        message: `User ${ctx.user.leetcoder.username} updated their profile`,
      })

      return result
    } catch (error) {
      console.log('update', error)
      await sendAdminNotification({
        event: 'PROFILE_UPDATE_ERROR',
        username: ctx?.user?.email || 'Unknown',
        message: `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile. Please try again later.',
      })
    }
  }),

  /**
   * Updates the avatar URL for a specific Leetcoder.
   *
   * @param {object} input - The input object containing the Leetcoder's ID and the new avatar URL.
   * @param {string} input.id - The unique ID of the Leetcoder whose avatar is to be updated.
   * @param {string} input.avatarUrl - The new URL for the Leetcoder's avatar.
   * @param {object} ctx - The tRPC context, containing user information for logging.
   * @throws {TRPCError} If the user ID is missing or an internal server error occurs during the update.
   * @returns {Promise<Leetcoder>} A promise that resolves to the updated Leetcoder object.
   */
  updateAvatar: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        avatarUrl: z.url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.id) {
        await sendAdminNotification({
          event: 'AVATAR_UPDATE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: 'Missing user ID when updating avatar',
        })
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Failed to update avatar. Please try again later.',
        })
      }

      try {
        const updated = await db.leetcoders.update({
          where: {
            id: input.id,
          },
          data: {
            avatar: input.avatarUrl,
          },
        })

        await sendAdminNotification({
          event: 'AVATAR_UPDATE_SUCCESS',
          username: ctx?.user?.email || 'Unknown',
          message: `User ${updated.username} updated their avatar`,
        })

        return updated
      } catch (error) {
        console.log('updateAvatar', error)
        await sendAdminNotification({
          event: 'AVATAR_UPDATE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: `Failed to update avatar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update avatar. Please try again later.',
        })
      }
    }),

  /**
   * Allows a suspended user to request to rejoin the platform, consuming their "second chance".
   * This updates their status to 'APPROVED', resets notification flag, and records the rejoin time.
   *
   * @param {object} ctx - The tRPC context, containing authenticated user details.
   * @throws {TRPCError} If the user is not logged in, not suspended, or has already used their second chance.
   * @returns {Promise<Leetcoder>} A promise that resolves to the updated Leetcoder object.
   */
  requestRejoin: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user || !ctx.user.leetcoder) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to request to rejoin',
      })
    }

    if (ctx.user.leetcoder.status === 'APPROVED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Only suspended users can request to rejoin',
      })
    }

    if (ctx.user.leetcoder.has_second_chance) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You have already used your second chance',
      })
    }

    const updatedUser = await db.leetcoders.update({
      where: { id: ctx.user.leetcoder.id },
      data: {
        status: 'APPROVED',
        is_notified: false,
        has_second_chance: true,
        rejoined_at: new Date(),
      },
    })

    await sendAdminNotification({
      event: 'REQUEST_REJOIN',
      username: ctx?.user?.leetcoder.username,
      email: ctx?.user?.leetcoder.email,
      message: 'Missing user ID when updating avatar',
    })

    return updatedUser
  }),

  /**
   * Admin-only endpoint to update any leetcoder's basic information (name, username, email, lc_username, gh_username).
   * Performs validation for uniqueness of username, email, LeetCode username, and GitHub username if they are being updated.
   * Also validates external LeetCode and GitHub usernames.
   *
   * @param {object} input - The input object containing the ID of the Leetcoder to update and optional fields.
   * @param {string} input.id - The unique ID of the Leetcoder to update.
   * @param {string} [input.name] - The new name for the Leetcoder.
   * @param {string} [input.username] - The new username for the Leetcoder.
   * @param {string} [input.email] - The new email for the Leetcoder.
   * @param {string} [input.lc_username] - The new LeetCode username for the Leetcoder.
   * @param {string} [input.gh_username] - The new GitHub username for the Leetcoder.
   * @param {object} ctx - The tRPC context, containing user information for authentication and logging.
   * @throws {TRPCError} If the authenticated user is not an admin,
   *                     if any updated unique field (username, email, LC username, GH username) is already taken,
   *                     if LeetCode or GitHub usernames are invalid, or an internal server error occurs.
   * @returns {Promise<Leetcoder>} A promise that resolves to the updated Leetcoder object.
   */
  updateLeetcoderAdmin: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(3).max(100).optional(),
        username: z.string().min(3).max(100).optional(),
        email: z.email().optional(),
        lc_username: z.string().optional(),
        gh_username: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check admin permissions
      if (ctx.user?.email && !ADMINS_EMAILS.includes(ctx.user.email)) {
        await sendAdminNotification({
          event: 'UNAUTHORIZED_ACCESS',
          username: ctx.user?.email || 'Unknown',
          message: 'Unauthorized attempt to update leetcoder as admin',
        })
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Only admin can access this resource',
        })
      }

      const { id, ...updateData } = input

      // Remove undefined values
      const cleanedData = Object.fromEntries(Object.entries(updateData).filter(([, value]) => value !== undefined))

      // Check for duplicate usernames if username is being updated
      if (cleanedData.username) {
        const existingUser = await db.leetcoders.findFirst({
          where: {
            username: cleanedData.username,
            id: { not: id },
          },
        })
        if (existingUser) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Username is already taken by another user',
          })
        }
      }

      // Check for duplicate emails if email is being updated
      if (cleanedData.email) {
        const existingUser = await db.leetcoders.findFirst({
          where: {
            email: cleanedData.email,
            id: { not: id },
          },
        })
        if (existingUser) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Email is already registered by another user',
          })
        }
      }

      // Check for duplicate LeetCode usernames if lc_username is being updated
      if (cleanedData.lc_username) {
        const existingUser = await db.leetcoders.findFirst({
          where: {
            lc_username: cleanedData.lc_username,
            id: { not: id },
          },
        })
        if (existingUser) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'LeetCode username is already registered by another user',
          })
        }

        // Validate LeetCode username exists
        const isLcValid = await checkLCUsername(cleanedData.lc_username)
        if (!isLcValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'The LeetCode username looks invalid. Could you verify it?',
          })
        }
      }

      // Check for duplicate GitHub usernames if gh_username is being updated
      if (cleanedData.gh_username) {
        const existingUser = await db.leetcoders.findFirst({
          where: {
            gh_username: cleanedData.gh_username,
            id: { not: id },
          },
        })
        if (existingUser) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'GitHub username is already registered by another user',
          })
        }

        // Validate GitHub username exists
        const isGhValid = await checkGHUsername(cleanedData.gh_username)
        if (!isGhValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'The GitHub username looks invalid. Could you verify it?',
          })
        }
      }

      try {
        const result = await db.leetcoders.update({
          where: { id },
          data: cleanedData,
        })

        await sendAdminNotification({
          event: 'ADMIN_LEETCODER_UPDATE',
          username: ctx?.user?.email || 'Unknown',
          message: `Admin updated leetcoder ${result.username} (${result.email})`,
        })

        return result
      } catch (error) {
        await sendAdminNotification({
          event: 'ADMIN_LEETCODER_UPDATE_ERROR',
          username: ctx?.user?.email || 'Unknown',
          message: `Failed to update leetcoder: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update leetcoder. Please try again later.',
        })
      }
    }),
})
