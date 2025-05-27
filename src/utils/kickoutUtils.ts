import { db } from '@/prisma/db'
import { sendReminderEmail } from '@/utils/email/sendReminderEmail'
import type { leetcoders } from '@prisma/client'
import type { LeetcoderWithSubmissions } from '@/types/leetcoders.type'

// Fetch unique group numbers using Prisma query
export const getUniqueGroupNos = async (leetcoders: LeetcoderWithSubmissions[]): Promise<number[]> => {
  try {
    const groups = await db.leetcoders.findMany({
      where: {
        id: { in: leetcoders.map((l) => l.id) },
        status: 'APPROVED',
      },
      distinct: ['group_no'],
      select: { group_no: true },
    })
    return groups.map((group) => group.group_no)
  } catch (error) {
    console.error('getUniqueGroupNos error:', error)
    throw error
  }
}

// Update leetcoder status to SUSPENDED and set all submissions to solved: false
export const kickOffLeetcoders = async (id: string): Promise<leetcoders> => {
  try {
    // First update the leetcoder status to SUSPENDED
    const updatedLeetcoder = await db.leetcoders.update({
      where: { id },
      data: { status: 'SUSPENDED' },
    })

    // Then update all submissions to solved: false
    await db.submissions.updateMany({
      where: { user_id: id },
      data: { solved: false },
    })

    console.log('Updated leetcoder:', updatedLeetcoder)
    return updatedLeetcoder
  } catch (error) {
    console.error(`kickOffLeetcoders error for ID ${id}:`, error)
    throw error
  }
}

// Fetch all approved leetcoders with their solved submissions
export const getAllLeetcoders = async (): Promise<LeetcoderWithSubmissions[]> => {
  try {
    return await db.leetcoders.findMany({
      where: {
        status: 'APPROVED',
      },
      select: {
        id: true,
        group_no: true,
        created_at: true,
        is_notified: true,
        email: true,
        submissions: {
          where: { solved: true },
          select: { problem_id: true },
        },
      },
    })
  } catch (error) {
    console.error('getAllLeetcoders error:', error)
    throw error
  }
}

// Fetch all assigned problems for given group numbers
export const getAllAssignedProblems = async (
  groupNos: number[],
  leetcoders: LeetcoderWithSubmissions[]
): Promise<Map<number, { id: string }[]>> => {
  const createdAtByGroup = new Map(leetcoders.map((l) => [l.group_no, l.created_at]))
  try {
    const roadmaps = await db.roadmap.findMany({
      where: {
        group_progress: {
          some: {
            group_no: { in: groupNos },
            // Filter by earliest created_at for each group
            created_at: {
              gte: new Date(Math.min(...groupNos.map((no) => (createdAtByGroup.get(no) || new Date(0)).getTime()))),
            },
          },
        },
      },
      select: {
        id: true,
        group_progress: { select: { group_no: true } },
      },
    })

    const roadmapMap = new Map<number, { id: string }[]>()
    for (const roadmap of roadmaps) {
      for (const progress of roadmap.group_progress) {
        const problems = roadmapMap.get(progress.group_no) || []
        problems.push({ id: roadmap.id })
        roadmapMap.set(progress.group_no, problems)
      }
    }
    return roadmapMap
  } catch (error) {
    console.error('getAllAssignedProblems error:', error)
    throw error
  }
}

// Get solved problem IDs for a leetcoder
export const getSolvedProblems = (leetcoder: LeetcoderWithSubmissions): string[] => {
  return leetcoder.submissions.map((submission) => submission.problem_id)
}

// Calculate unsolved problems
export const calculateUnsolvedProblems = (
  assignedProblems: { id: string }[],
  solvedProblems: string[]
): { id: string }[] => {
  return assignedProblems.filter((problem) => !solvedProblems.includes(problem.id))
}

// Update notification status for a leetcoder
export const updateIsNotified = async (leetcoderId: string): Promise<leetcoders> => {
  try {
    return await db.leetcoders.update({
      where: { id: leetcoderId },
      data: { is_notified: true },
    })
  } catch (error) {
    console.error(`updateIsNotified error for ID ${leetcoderId}:`, error)
    throw error
  }
}

// Process a single leetcoder
export const processLeetcoder = async (
  leetcoder: LeetcoderWithSubmissions,
  assignedProblems: { id: string }[],
  unsolvedThreshold: number
): Promise<void> => {
  if (assignedProblems.length < unsolvedThreshold) return

  const solvedProblems = getSolvedProblems(leetcoder)
  const unsolvedProblems = calculateUnsolvedProblems(assignedProblems, solvedProblems)

  if (unsolvedProblems.length > unsolvedThreshold) {
    if (leetcoder.is_notified) {
      await kickOffLeetcoders(leetcoder.id)
    } else {
      await Promise.all([
        sendReminderEmail({
          group_no: String(leetcoder.group_no),
          email: leetcoder.email,
        }),
        updateIsNotified(leetcoder.id),
      ])
    }
  }
}
