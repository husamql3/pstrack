import type { leetcoders } from '@prisma/client'

import { db } from '@/prisma/db'

export const getLeetcoderById = async (id: string): Promise<leetcoders | null> => {
  try {
    return db.leetcoders.findFirst({
      where: {
        id,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}
