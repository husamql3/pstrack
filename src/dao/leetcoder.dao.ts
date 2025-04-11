import type { leetcoders } from '@prisma/client'

import prisma from '@/prisma/prisma'

export const getLeetcoderById = async (id: string): Promise<leetcoders | null> => {
  try {
    return prisma.leetcoders.findFirst({
      where: {
        id,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}
