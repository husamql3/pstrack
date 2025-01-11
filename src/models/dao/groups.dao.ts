import prisma from '@/models/prisma/prisma'

export const checkGroupExists = async (groupNo: number): Promise<boolean> => {
  try {
    const group = await prisma.groups.findUnique({
      where: {
        group_no: groupNo,
      },
    })

    return !!group
  } catch (error) {
    console.error('catch checkGroupExists error:', error)
    return false
  }
}
