import prisma from '@/models/prisma/prisma'

import { group_progress } from '@prisma/client'

export const fetchGroupProgress = async (groupNo: number): Promise<group_progress[]> => {
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
