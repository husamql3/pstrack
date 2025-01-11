import { leetcoders } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

import prisma from '@/models/prisma/prisma'

export const addLeetcoder = async (
  user_id: string,
  request: Omit<leetcoders, 'created_at'>
): Promise<leetcoders> => {
  try {
    return prisma.leetcoders.create({
      data: {
        ...request,
        id: user_id,
        status: 'pending',
        created_at: new Date(),
      },
    })
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('You are already registered.')
    }

    console.error('insertLeetcoder error:', error)
    return {} as leetcoders
  }
}

export const approveLeetcoder = async (id: string): Promise<leetcoders> => {
  try {
    return await prisma.leetcoders.update({
      where: {
        id: id,
      },
      data: {
        status: 'approved',
      },
    })
  } catch (error) {
    console.error('catch approveLeetcoder error:', error)
    return {} as leetcoders
  }
}

export const fetchLeetcoder = async (id: string): Promise<leetcoders | null> => {
  try {
    return await prisma.leetcoders.findUnique({
      where: {
        id: id,
      },
    })
  } catch (error) {
    console.error('catch fetchLeetcoder error:', error)
    return null
  }
}
