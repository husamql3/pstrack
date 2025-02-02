import { group_progress, roadmap } from '@prisma/client'

import prisma from '@/prisma/prisma'

export const fetchRoadmap = async (groupProgress: group_progress[]): Promise<roadmap[]> => {
  try {
    // If groupProgress is empty or invalid, return an empty array
    if (!groupProgress || groupProgress.length === 0) return []

    // Extract current_problem from groupProgress
    const currentProblems: number[] = groupProgress.map((gp) => gp.current_problem)

    // Fetch roadmap records where problem_order is in currentProblems
    return await prisma.roadmap.findMany({
      where: {
        problem_order: {
          in: currentProblems,
        },
      },
    })
  } catch (error) {
    console.error('catch fetchRoadmap error:', error)
    return []
  }
}
