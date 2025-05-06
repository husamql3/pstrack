import { z } from 'zod'

import { db } from '@/prisma/db'
import { redis } from '@/config/redis'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import type { RoadmapType } from '@/app/(public)/roadmap/_components/roadmap'

export const roadmapRouter = createTRPCRouter({
  getGroupProblems: publicProcedure
    .input(
      z.array(
        z.object({
          current_problem: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      if (!input.length) return []
      const currentProblems = input.map((gp) => gp.current_problem)
      return await db.roadmap.findMany({
        where: {
          problem_order: {
            in: currentProblems,
          },
        },
      })
    }),

  /**
   * get the roadmap data for /roadmap
   * cache for 7 days
   */
  getRoadmap: publicProcedure.query(async () => {
    const cacheKey = 'roadmap:data'
    const cachedData = (await redis.get(cacheKey)) as RoadmapType[] | null
    if (cachedData) {
      console.log('# roadmap data cached')
      return cachedData
    }

    const allProblems = await db.roadmap.findMany({
      orderBy: {
        problem_order: 'asc',
      },
    })

    const problemsByTopic = allProblems.reduce(
      (acc, problem) => {
        if (!acc[problem.topic]) {
          acc[problem.topic] = []
        }
        acc[problem.topic].push(problem)
        return acc
      },
      {} as Record<string, typeof allProblems>
    )

    // Convert to array format if needed
    const groupedResults = Object.entries(problemsByTopic).map(([topic, problems]) => ({
      topic,
      problems,
    }))

    // Cache the results
    await redis.set(cacheKey, groupedResults, { ex: 604800 }) // cache for 7 days

    return groupedResults
  }),

  /**
   * get the count of problems in the roadmap
   * cache for 7 days
   */
  count: publicProcedure.query(async () => {
    const cacheKey = 'roadmap:problemCount'
    const cachedData = (await redis.get(cacheKey)) as number | null
    if (cachedData) return cachedData

    const problemsCount = await db.roadmap.count()
    await redis.set(cacheKey, problemsCount, { ex: 604800 }) // cache for 7 days

    return problemsCount
  }),
})
