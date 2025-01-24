import { leetcoders, Prisma, submissions } from '@prisma/client'

import prisma from '@/prisma/prisma'

type LeetcoderWithSubmissions = leetcoders & {
  submissions: submissions[]
  is_notified: boolean
}

export const getAllLeetcoders = async (): Promise<LeetcoderWithSubmissions[]> => {
  try {
    return (await prisma.leetcoders.findMany({
      where: {
        OR: [
          {
            submissions: {
              none: {
                solved: true,
              },
            },
          },
          {
            submissions: {
              some: {
                solved: true,
              },
            },
          },
        ],
      },
      include: {
        submissions: {
          where: {
            solved: true,
          },
        },
      },
    })) as LeetcoderWithSubmissions[]
  } catch (error) {
    console.error('catch getAllLeetcoders error:', error)
    return []
  }
}

export const updateIsNotified = async (leetcoderId: string): Promise<leetcoders> => {
  try {
    return await prisma.leetcoders.update({
      where: {
        id: leetcoderId,
      },
      data: {
        is_notified: true,
      } as Prisma.leetcodersUpdateInput,
    })
  } catch (error) {
    console.error('Error updating leetcoder notification status:', error)
    throw error
  }
}

export const kickOffLeetcoders = async (id: string) => {
  try {
    return await prisma.leetcoders.update({
      where: {
        id: id,
      },
      data: {
        status: 'SUSPENDED',
      },
    })
  } catch (error) {
    console.error('catch kickOffLeetcoders error:', error)
    return {} as leetcoders
  }
}
