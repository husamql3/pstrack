import { roadmap } from '@prisma/client'

import prisma from '@/prisma/prisma'

export const fetchRoadmap = async (): Promise<roadmap[]> => {
  try {
    return await prisma.roadmap.findMany()
  } catch (error) {
    console.error('catch fetchRoadmap error:', error)
    return []
  }
}
