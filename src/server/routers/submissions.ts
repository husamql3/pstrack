import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'
import { recentSubmissionListQuery } from '@/data/queries/recentSubmissionList.gql'
import { LEETCODE_GQL_BASE_URL } from '@/data/constants'

// In-memory cache for submissions
const submissionCache = new Map<string, { submissions: RecentSubmission[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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
      console.log('createSubmission', input)

      const start = Date.now()
      const isSolved = await validateProblemSolved(input.lcUsername, input.problemSlug)
      console.log('Validation took:', Date.now() - start, 'ms')

      if (!isSolved) {
        console.log('validateProblemSolved', isSolved)
        throw new Error('Problem not solved')
      }

      return db.submissions.create({
        data: {
          user_id: input.userId,
          problem_id: input.problemId,
          solved: true,
          group_no: input.group_no,
        },
      })
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
  const cached = submissionCache.get(lcUsername)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for ${lcUsername}`)
    return cached.submissions.some(
      (submission) => submission.titleSlug === problemSlug && submission.status === 10
    )
  }

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

    // Cache submissions
    submissionCache.set(lcUsername, { submissions, timestamp: Date.now() })

    return submissions.some(
      (submission) => submission.titleSlug === problemSlug && submission.status === 10
    )
  } catch (error) {
    console.error('Error validating daily problem submission:', error)
    return false
  }
}
