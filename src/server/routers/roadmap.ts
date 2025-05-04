import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/trpc'
import { db } from '@/prisma/db'

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
  getRoadmap: publicProcedure.query(async () => {
    const allProblems = await db.roadmap.findMany({
      orderBy: {
        problem_order: 'asc',
      },
      where: {
        deleted: false,
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

    return groupedResults
  }),
  count: publicProcedure.query(async () => {
    return db.roadmap.count({
      where: { deleted: false },
    })
  }),
})
