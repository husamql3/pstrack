import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { LeetcodeStatus } from '@prisma/client'

import { db } from '@/prisma/db'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { checkGHUsername, checkLCUsername } from '@/utils/checkLeetcoder'
import { checkDuplicateUsername, checkPendingLeetcoder } from '@/dao/leetcoder.dao'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { ADMINS_EMAILS, MAX_LEETCODERS } from '@/data/constants'
import { sendRequestReceivedEmail } from '@/utils/email/sendRequestReceived'
import { updateLeetcoderSchema } from '@/types/leetcoders.type'

export const leetcodersRouter = createTRPCRouter({
  getLeetcoderById: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    if (!input.id) return null
    return db.leetcoders.findUnique({
      where: { id: input.id },
    })
  }),
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
  checkLeetcoder: publicProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ input }) => {
    if (!input.id) return false
    const leetcoder = await db.leetcoders.findUnique({
      where: { id: input.id },
    })
    return !!leetcoder
  }),
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
  changeGroup: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        newGroupNo: z.number().int().positive(),
      })
    )
    .mutation(async ({ input }) => {
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User is already in the selected group.',
        })
      }

      const group = await db.groups.findUnique({
        where: { group_no: newGroupNo },
      })

      if (!group) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected group does not exist.',
        })
      }

      const count = await db.leetcoders.count({
        where: { group_no: newGroupNo },
      })

      if (count >= MAX_LEETCODERS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Selected group is full.',
        })
      }

      try {
        return await db.$transaction(async (tx) => {
          await tx.submissions.updateMany({
            where: { user_id: userId },
            data: {
              solved: false,
              group_no: newGroupNo,
            },
          })

          return await tx.leetcoders.update({
            where: { id: userId },
            data: { group_no: newGroupNo },
          })
        })
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to change group. Please try again later.',
        })
      }
    }),

  update: publicProcedure.input(updateLeetcoderSchema).mutation(async ({ input, ctx }) => {
    if (!ctx.user?.id || !ctx.user.leetcoder || ctx.user.id !== input.id) {
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This GitHub username is already registered by another user',
        })
      }

      // Validate GitHub username exists
      const isGhValid = await checkGHUsername(input.gh_username)
      if (!isGhValid) {
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
      return await db.leetcoders.update({
        where: { id: input.id },
        data: updateData,
      })
    } catch (error) {
      console.log('update', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile. Please try again later.',
      })
    }
  }),

  updateAvatar: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        avatarUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      if (!input.id) {
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
        return updated
      } catch (error) {
        console.log('updateAvatar', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update avatar. Please try again later.',
        })
      }
    }),

  getLeaderboard: publicProcedure
    .input(z.object({ groupNo: z.number() }))
    .query(async ({ input }) => {
      try {
        // Get top 3 leetcoders with most submissions
        const topLeetcoders = await db.leetcoders.findMany({
          where: {
            status: 'APPROVED',
            group_no: input.groupNo
          },
          include: {
            submissions: {
              where: {
                solved: true,
              },
            },
          },
          take: 3,
        })

        return topLeetcoders.map(leetcoder => ({
          id: leetcoder.id,
          name: leetcoder.name,
          username: leetcoder.username,
          avatar: leetcoder.avatar,
          submissionCount: leetcoder.submissions.length,
        }))
      } catch (error) {
        console.log('getLeaderboard', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch leaderboard. Please try again later.',
        })
      }
    }),
})
