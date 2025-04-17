import type { leetcoders } from '@prisma/client'

import { db } from '@/prisma/db'

export const getLeetcoderById = async (id: string): Promise<leetcoders | null> => {
  try {
    return db.leetcoders.findFirst({
      where: {
        id,
      },
    })
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

export const checkPendingLeetcoder = async (
  userId: string
): Promise<{ isValid: boolean; message: string }> => {
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
