import { group_progress, roadmap } from '@prisma/client'

import prisma from '@/prisma/prisma'

export const fetchRoadmap = async (
  groupProgress: group_progress[]
): Promise<roadmap[]> => {
  try {
    // If groupProgress is empty or invalid, return an empty array
    if (!groupProgress || groupProgress.length === 0) {
      return []
    }

    // Find the maximum current_problem for the group
    const maxCurrentProblem = Math.max(
      ...groupProgress.map((gp) => gp.current_problem || 0)
    )

    // Fetch all problems where problem_order is less than or equal to the max current_problem
    return await prisma.roadmap.findMany({
      where: {
        problem_order: {
          lte: maxCurrentProblem,
        },
      },
    })
  } catch (error) {
    console.error('catch fetchRoadmap error:', error)
    return []
  }
}

export const fetchAllRoadmap = async (): Promise<roadmap[]> => {
  try {
    // await connectRedis()
    // const cacheKey = 'roadmap-data'
    // const cachedData = await redisClient.get(cacheKey)

    // if (cachedData) {
    //   return JSON.parse(cachedData)
    // }

    const data = await prisma.roadmap.findMany()
    // await redisClient.set(cacheKey, JSON.stringify(data), { EX: 60 * 60 * 24 * 7 }) // cache for 1 week
    return data
  } catch (error) {
    console.error('catch fetchAllRoadmap error:', error)
    return []
  }
}
