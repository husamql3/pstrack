import prisma from '@/prisma/prisma'
import { leetcoders } from '@prisma/client'

export const getAllLeetcoders = async () => {
  try {
    return await prisma.leetcoders.findMany({
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
    })
  } catch (error) {
    console.error('catch getAllLeetcoders error:', error)
    return []
  }
}

export const updateIsNotified = async (id: string) => {
  try {
    return await prisma.leetcoders.update({
      where: {
        id: id,
      },
      data: {
        is_notified: true,
      },
    })
  } catch (error) {
    console.error('catch updateIsNotified error:', error)
    return {} as leetcoders
  }
}

export const kickOffLeetcoders = async (id: string) => {
  try {
    return await prisma.leetcoders.update({
      where: {
        id: id,
      },
      data: {
        status: 'suspended',
      },
    })
  } catch (error) {
    console.error('catch kickOffLeetcoders error:', error)
    return {} as leetcoders
  }
}
