import { submissions } from '@prisma/client'

import prisma from '@/prisma/prisma'

export const addCheckSubmission = async (submission: submissions): Promise<submissions> => {
  try {
    return await prisma.submissions.create({
      data: {
        user_id: submission.user_id,
        problem_id: submission.problem_id,
        group_no: submission.group_no,
        solved: true,
      },
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
