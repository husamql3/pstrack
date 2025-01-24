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
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        gh_username: true,
        lc_username: true,
        group_no: true,
        is_notified: true,
        submissions: {
          where: {
            solved: true,
          },
          select: {
            id: true,
            created_at: true,
            group_no: true,
            user_id: true,
            problem_id: true,
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
