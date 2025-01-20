import { roadmap } from '@prisma/client'

import prisma from '@/prisma/prisma'

export const fetchRoadmap = async (current_problem: number): Promise<roadmap[]> => {
  try {
    return await prisma.roadmap.findMany({
      where: {
        problem_order: {
          lte: current_problem,
        },
      },
    })
  } catch (error) {
    console.error('catch fetchRoadmap error:', error)
    return []
  }
}
