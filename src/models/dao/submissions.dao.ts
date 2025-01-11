import { submissions } from '@prisma/client'

import prisma from '@/models/prisma/prisma'

export const addCheckSubmission = async (
  submission: submissions
): Promise<submissions> => {
  try {
    return await prisma.submissions.create({
      data: submission,
    })
  } catch (error) {
    console.error('catch addCheckSubmission error:', error)
    return {} as submissions
  }
}

export const fetchGroupSubmissions = async (group_no: number): Promise<submissions[]> => {
  try {
    return await prisma.submissions.findMany({
      where: {
        group_no: group_no,
      },
    })
  } catch (error) {
    console.error('catch fetchGroupSubmissions error:', error)
    return []
  }
}
