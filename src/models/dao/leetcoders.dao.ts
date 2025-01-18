import { leetcoders } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

import prisma from '@/models/prisma/prisma'
import { LeetcoderRequest, Leetcoders } from '@/types/leetcoder.type'

export const addLeetcoder = async (
  user_id: string,
  request: LeetcoderRequest
): Promise<leetcoders> => {
  try {
    return prisma.leetcoders.create({
      data: {
        ...request,
        id: user_id,
        status: 'pending',
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

export const fetchPendingLeetcoders = async (): Promise<Leetcoders[]> => {
  try {
    const data = await prisma.leetcoders.findMany({
      where: {
        status: 'pending',
      },
    })

    return data.map((item) => ({
      ...item,
      created_at: item.created_at ? item.created_at.toISOString() : null,
    }))
  } catch (error) {
    console.error('catch approveLeetcoder error:', error)
    return []
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

export const fetchGroupLeetcoders = async (group_no: number): Promise<leetcoders[]> => {
  try {
    return await prisma.leetcoders.findMany({
      where: {
        group_no: group_no,
        status: 'approved',
      },
    })
  } catch (error) {
    console.error('catch fetchGroupLeetcoders error:', error)
    return []
  }
}

export const isLeetcoderApproved = async (id: string): Promise<boolean> => {
  if (!id) return false

  try {
    const data = await prisma.leetcoders.findUnique({
      where: {
        id: id,
        status: 'approved',
      },
    })

    return !!data
  } catch (error) {
    console.error('catch isLeetcoderApproved error:', error)
    return false
  }
}

export const isUsernameExist = async (username: string): Promise<boolean> => {
  try {
    const data = await prisma.leetcoders.findMany({
      where: {
        username,
      },
    })

    return !!data
  } catch (error) {
    console.error('catch isUsernameExist error:', error)
    return false
  }
}
