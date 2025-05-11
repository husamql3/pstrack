import { z } from 'zod'

import { db } from '@/prisma/db'
import { redis } from '@/config/redis'
import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import type { RoadmapType } from '@/app/(public)/roadmap/_components/roadmap'
import { REDIS_KEYS } from '@/data/constants'
import type { roadmap } from '@prisma/client'
import { logger } from '@/utils/logger'

export const roadmapRouter = createTRPCRouter({
  /**
   * Get group problems for /group/[groupId] page
   * revalidates every 24 hours
   * @returns {roadmap[]}
   */
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

      const cachedProblems = (await redis.get(REDIS_KEYS.GROUP_PROBLEMS(input[0].current_problem.toString()))) as roadmap[] | null
      if (cachedProblems) {
        logger.info(`[Cache] Using cached group problems for problem ${input[0].current_problem}`)
        return cachedProblems
      }

      const currentProblems = input.map((gp) => gp.current_problem)
      const groupProblems = await db.roadmap.findMany({
        where: {
          problem_order: {
            in: currentProblems,
          },
        },
      })

      await redis.set(REDIS_KEYS.GROUP_PROBLEMS(input[0].current_problem.toString()), groupProblems, { ex: 86400 }) // cache for one day
      return groupProblems
    }),

  /**
   * get the roadmap data for /roadmap
   */
  getRoadmap: publicProcedure.query(async () => {
    const cachedData = (await redis.get(REDIS_KEYS.ROADMAP_DATA)) as RoadmapType[] | null
    if (cachedData) {
      logger.info('[Cache] Using cached roadmap data')
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

    const groupedResults = Object.entries(problemsByTopic).map(([topic, problems]) => ({
      topic,
      problems,
    }))

    await redis.set(REDIS_KEYS.ROADMAP_DATA, groupedResults)
    return groupedResults
  }),

  /**
   * get the count of problems in the roadmap
   */
  count: publicProcedure.query(async () => {
    const cachedData = (await redis.get(REDIS_KEYS.ROADMAP_PROBLEM_COUNT)) as number | null
    if (cachedData) {
      logger.info('[Cache] Using cached roadmap problem count')
      return cachedData
    }

    const problemsCount = await db.roadmap.count()

    await redis.set(REDIS_KEYS.ROADMAP_PROBLEM_COUNT, problemsCount)
    return problemsCount
  }),
})
