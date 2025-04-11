import { db } from '@/prisma/db'

export const getAllGroupsNo = async (): Promise<{ group_no: number }[]> => {
  try {
    const groups = await db.groups.findMany({
      select: { group_no: true },
    })
    return groups
  } catch (error) {
    console.error('Error fetching all groups:', error)
    return []
  }
}

export const getGroupByNo = async (groupNo: number): Promise<{ group_no: number } | null> => {
  try {
    const group = await db.groups.findUnique({
      where: { group_no: groupNo },
      select: { group_no: true },
    })
    return group || null
  } catch (error) {
    console.error('Error fetching group by no:', error)
    return null
  }
}
