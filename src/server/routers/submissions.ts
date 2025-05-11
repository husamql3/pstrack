import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'
import { recentSubmissionListQuery } from '@/data/queries/recentSubmissionList.gql'
import { LEETCODE_GQL_BASE_URL, REDIS_KEYS } from '@/data/constants'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { redis } from '@/config/redis'

export const submissionsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        problemId: z.string().uuid(),
        group_no: z.string().transform((val) => Number(val)),
        problemSlug: z.string(),
        lcUsername: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const isSolved = await validateProblemSolved(input.lcUsername, input.problemSlug)
        if (!isSolved) {
          console.log('validateProblemSolved', isSolved)
          await sendAdminNotification({
            event: 'SUBMISSION_VALIDATION_FAILED',
            username: input.lcUsername,
            userMetadata: JSON.stringify({
              userId: input.userId,
              problemSlug: input.problemSlug,
            }),
          })
          throw new Error('Problem not solved')
        }

        await redis.del(REDIS_KEYS.GROUP_DATA(input.group_no.toString()))
        return db.submissions.create({
          data: {
            user_id: input.userId,
            problem_id: input.problemId,
            solved: true,
            group_no: input.group_no,
          },
        })
      } catch (error) {
        await sendAdminNotification({
          event: 'SUBMISSION_ERROR',
          username: input.lcUsername,
          userMetadata: JSON.stringify({
            userId: input.userId,
            problemSlug: input.problemSlug,
            error: error instanceof Error ? error.message : String(error),
          }),
        })
        throw error
      }
    }),
})

export type RecentSubmission = {
  title: string
  titleSlug: string
  status: number
  lang: string
  timestamp: string
}

export type ValidateDailyProblemSolved = {
  lc_username: string
  problem_slug: string
}

const validateProblemSolved = async (lcUsername: string, problemSlug: string) => {
  const payload = {
    query: recentSubmissionListQuery,
    variables: { username: lcUsername },
  }

  try {
    const response = await fetch(LEETCODE_GQL_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      console.error('Error validating submission:', {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
      })
      return false
    }

    const data = await response.json()
    if (data.errors) {
      console.error('GraphQL errors:', data.errors)
      return false
    }

    console.log('LeetCode response:', JSON.stringify(data.data.recentSubmissionList))
    if (!data.data?.recentSubmissionList.length) {
      console.error('No submissions found for user:', lcUsername)
      return false
    }

    const submissions = (data.data?.recentSubmissionList ?? []) as RecentSubmission[]
    console.log('LeetCode response:', JSON.stringify(submissions))

    return submissions.some((submission) => submission.titleSlug === problemSlug && submission.status === 10)
  } catch (error) {
    console.error('Error validating daily problem submission:', error)
    return false
  }
}
