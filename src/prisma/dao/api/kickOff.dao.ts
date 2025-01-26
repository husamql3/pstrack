import { leetcoders, Prisma, submissions } from '@prisma/client'

import prisma from '@/prisma/prisma'
import { sendSolveProblemsRemider } from '@/utils/email/sendSolveProblemsRemider'

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

export const hasSolvedCurrentProblem = (
  leetcoder: LeetcoderWithSubmissions,
  currentProblemId: string
): boolean => {
  return leetcoder.submissions.some(
    (submission) => submission.problem_id === currentProblemId && submission.solved
  )
}

export const getAssignedProblems = async (groupNo: number) => {
  return await prisma.roadmap.findMany({
    where: {
      group_progress: {
        some: {
          group_no: groupNo,
        },
      },
    },
    select: {
      id: true,
    },
  })
}

export const getSolvedProblems = (leetcoder: LeetcoderWithSubmissions) => {
  return leetcoder.submissions
    .filter((submission) => submission.solved)
    .map((submission) => submission.problem_id)
}

export const calculateUnsolvedProblems = (
  assignedProblems: { id: string }[],
  solvedProblems: string[]
) => {
  return assignedProblems.filter((problem) => !solvedProblems.includes(problem.id))
}

export const processLeetcoder = async (
  leetcoder: LeetcoderWithSubmissions,
  unsolvedThreshold = 6
) => {
  const assignedProblems = await getAssignedProblems(leetcoder.group_no)
  const solvedProblems = getSolvedProblems(leetcoder)
  const unsolvedProblems = calculateUnsolvedProblems(assignedProblems, solvedProblems)

  if (unsolvedProblems.length >= unsolvedThreshold) {
    if (leetcoder.is_notified) {
      await kickOffLeetcoders(leetcoder.id)
    } else {
      await sendSolveProblemsRemider({
        to: leetcoder.email,
        group_no: String(leetcoder.group_no),
      })
      await updateIsNotified(leetcoder.id)
    }
  }
}
