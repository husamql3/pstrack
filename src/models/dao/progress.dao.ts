import { group_progress } from '@prisma/client'
import prisma from '@/models/prisma/prisma'

export const getGroupProgress = async (groupNo: number): Promise<group_progress[]> => {
  try {
    return prisma.group_progress.findMany({
      where: {
        group_no: groupNo,
      },
    })
  } catch (error) {
    console.error('catch getGroupProgress error:', error)
    return []
  }
}
