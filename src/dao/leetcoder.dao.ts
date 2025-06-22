import type { groups, leetcoders, roadmap } from '@prisma/client'

import { db } from '@/prisma/db'

export const getLeetcoderById = async (id: string): Promise<leetcoders | null> => {
  try {
    const leetcoder = await db.leetcoders.findUnique({
      where: {
        id,
      },
    })

    return leetcoder || null
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export const checkDuplicateUsername = async (
  username: string,
  lc_username: string
): Promise<{ isValid: boolean; message: string }> => {
  try {
    // Check for duplicate username
    const existingUsername = await db.leetcoders.findUnique({
      where: { username },
      select: { username: true },
    })

    if (existingUsername) {
      return {
        isValid: false,
        message: 'This username is already taken. Please choose a different username.',
      }
    }

    // Check for duplicate LeetCode username
    const existingLcUsername = await db.leetcoders.findFirst({
      where: { lc_username },
      select: { lc_username: true },
    })

    if (existingLcUsername) {
      return {
        isValid: false,
        message: 'This LeetCode username is already registered in our platform.',
      }
    }

    return { isValid: true, message: '' }
  } catch (error) {
    console.error('Error checking for duplicate usernames:', error)
    return {
      isValid: false,
      message: 'An error occurred while validating your information.',
    }
  }
}

export const checkPendingLeetcoder = async (userId: string): Promise<{ isValid: boolean; message: string }> => {
  try {
    // Check if user already has a pending application
    const existingApplication = await db.leetcoders.findFirst({
      where: {
        id: userId,
        status: 'PENDING',
      },
      select: { id: true, status: true },
    })

    if (existingApplication) {
      return {
        isValid: false,
        message: 'You already have a pending request. Please wait for approval!',
      }
    }

    return { isValid: true, message: '' }
  } catch (error) {
    console.error('Error checking for pending applications:', error)
    return {
      isValid: false,
      message: 'An error occurred while validating your application status.',
    }
  }
}

export const fetchApprovedLeetcodersWithProblems = async (): Promise<{
  approvedLeetcoders: (leetcoders & { group: groups })[]
  groupProblems: Map<number, roadmap>
}> => {
  try {
    // Fetch all groups with their latest progress
    const groups = await db.groups.findMany({
      include: {
        group_progress: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    })

    // Fetch today's problem for each group
    const groupProblems = new Map()
    for (const group of groups) {
      const latestProgress = group.group_progress[0]

      if (latestProgress) {
        const problem = await db.roadmap.findUnique({
          where: { problem_order: latestProgress.current_problem },
        })

        if (problem) groupProblems.set(group.group_no, problem)
      }
    }

    // Fetch all APPROVED leetcoders
    const approvedLeetcoders = await db.leetcoders.findMany({
      where: { status: 'APPROVED' },
      include: { group: true },
    })

    return { approvedLeetcoders, groupProblems }
  } catch (error) {
    console.error('Error fetching approved leetcoders:', error)
    throw new Error('Failed to fetch approved leetcoders')
  }
}
