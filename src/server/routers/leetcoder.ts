import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { LeetcodeStatus } from '@prisma/client'

import { db } from '@/prisma/db'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { checkGHUsername, checkLCUsername } from '@/utils/checkLeetcoder'
import { checkDuplicateUsername, checkPendingLeetcoder } from '@/dao/leetcoder.dao'
import { env } from '@/config/env.mjs'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'

export const leetcodersRouter = createTRPCRouter({
  getLeetcoderById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      if (!input.id) return null
      return db.leetcoders.findUnique({
        where: { id: input.id },
      })
    }),
  getAllLeetcoders: publicProcedure.query(async ({ ctx }) => {
    // Only allow access if the user is the admin
    if (ctx.user && ctx.user.email !== env.ADMIN_EMAIL) {
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
  checkLeetcoder: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
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
        lc_username: z
          .string()
          .min(3, { message: 'LeetCode username must be at least 3 characters long' })
          .refine((val) => /^[a-zA-Z0-9_-]+$/.test(val), {
            message:
              'LeetCode username must contain only letters, numbers, underscores, and hyphens',
          }),
        gh_username: z
          .string()
          .optional()
          .refine((val) => val === undefined || val === '' || /^[a-zA-Z0-9_-]+$/.test(val), {
            message: 'GitHub username must contain only letters, numbers, underscores, and hyphens',
          }),
        group_no: z.string().transform((val) => Number(val)),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const pendingResult = await checkPendingLeetcoder(ctx?.user?.id as string)
      if (typeof pendingResult !== 'boolean' && !pendingResult.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: pendingResult.message,
        })
      }

      // Check for duplicate usernames first to avoid unnecessary API calls
      const duplicateResult = await checkDuplicateUsername(input.username, input.lc_username)
      if (typeof duplicateResult !== 'boolean' && !duplicateResult.isValid) {
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: "Hmm, that LeetCode username doesn't seem right. Please double-check it!",
        })
      }
      if (input.gh_username && !isGhValid) {
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

        // Send notification to admin about new join request
        await sendAdminNotification({
          event: 'NEW_JOIN_REQUEST',
          groupNo: input.group_no.toString(),
          username: input.username,
          name: input.name,
          email: ctx?.user?.email as string,
          leetcodeUsername: input.lc_username,
          githubUsername: input.gh_username || 'Not provided',
          timestamp: new Date().toISOString(),
        })

        return newLeetcoder
      } catch (error) {
        // Check if error is related to duplicate user ID
        if (
          error instanceof Error &&
          error.message.includes('Unique constraint failed on the fields: (`id`)')
        ) {
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
      if (ctx.user && ctx.user.email !== env.ADMIN_EMAIL) {
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
  deleteLeetcoder: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Only allow access if the user is the admin
      if (ctx.user && ctx.user.email !== env.ADMIN_EMAIL) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Only admin can access this resource',
        })
      }
      return db.leetcoders.delete({
        where: { id: input.id },
      })
    }),
})
