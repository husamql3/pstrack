import type { leetcoders } from '@prisma/client'

import { db } from '@/prisma/db'
import { UNSOLVED_THRESHOLD } from '@/data/constants'
import { sendReminderEmail } from '@/utils/email/sendReminderEmail'

export type NeglectedLeetcoder = Pick<
  leetcoders,
  'id' | 'name' | 'lc_username' | 'email' | 'group_no' | 'is_notified' | 'status'
> & {
  submissionCount: number
}

/**
 * Fetches all approved Leetcoders from the database along with their solved submission counts.
 * Only 'APPROVED' Leetcoders are considered, and only 'solved' submissions are counted.
 *
 * @returns {Promise<leetcoders[]>} A promise that resolves to an array of NeglectedLeetcoder objects.
 * @throws {Error} If there is an error fetching the leetcoders or submissions from the database.
 */
export const getAllLeetcodersWithSubmissions = async (): Promise<NeglectedLeetcoder[]> => {
  try {
    const leetcoders = await db.leetcoders.findMany({
      where: {
        status: 'APPROVED', // Only check approved leetcoders
      },
      include: {
        submissions: {
          where: {
            solved: true, // Only count solved submissions
          },
        },
      },
    })

    return leetcoders.map((leetcoder) => ({
      id: leetcoder.id,
      name: leetcoder.name,
      lc_username: leetcoder.lc_username,
      email: leetcoder.email,
      group_no: leetcoder.group_no,
      submissionCount: leetcoder.submissions.length,
      is_notified: leetcoder.is_notified,
      status: leetcoder.status,
    }))
  } catch (error) {
    console.error('Error fetching leetcoders with submissions:', error)
    throw new Error('Failed to fetch leetcoders with submissions')
  }
}

/**
 * Retrieves a list of 'neglected' Leetcoders. A Leetcoder is considered neglected
 * if their solved `submissionCount` is less than the `UNSOLVED_THRESHOLD`.
 *
 * @returns {Promise<NeglectedLeetcoder[]>} A promise that resolves to an array of NeglectedLeetcoder objects.
 * @throws {Error} If there is an error fetching all Leetcoders.
 */
export const getNeglectedLeetcoders = async (): Promise<NeglectedLeetcoder[]> => {
  try {
    const allLeetcoders = await getAllLeetcodersWithSubmissions()

    // Filter leetcoders with submission count less than threshold
    return allLeetcoders.filter((leetcoder) => leetcoder.submissionCount < UNSOLVED_THRESHOLD)
  } catch (error) {
    console.error('Error getting neglected leetcoders:', error)
    throw new Error('Failed to get neglected leetcoders')
  }
}

/**
 * Updates the notification status for a specific Leetcoder.
 *
 * @param {string} leetcoderId - The unique identifier of the Leetcoder to update.
 * @param {boolean} isNotified - The new notification status (true if notified, false otherwise).
 * @param {string} email - The email address of the Leetcoder.
 * @param {string} groupNo - The group number of the Leetcoder.
 * @returns {Promise<leetcoders | null>} A promise that resolves to the updated Leetcoder object,
 *                                       or null if the update fails.
 */
export const updateLeetcoderNotificationStatus = async (
  leetcoderId: string,
  isNotified: boolean,
  email: string,
  groupNo: string
): Promise<leetcoders | null> => {
  try {
    const updatedLeetcoder = await db.leetcoders.update({
      where: { id: leetcoderId },
      data: { is_notified: isNotified },
    })

    await sendReminderEmail({
      group_no: groupNo,
      email: email,
    })

    return updatedLeetcoder
  } catch (error) {
    console.error('Error updating leetcoder notification status:', error)
    return null
  }
}

/**
 * Suspends a Leetcoder by changing their status to 'SUSPENDED' and setting `is_notified` to true.
 *
 * @param {string} leetcoderId - The unique identifier of the Leetcoder to suspend.
 * @returns {Promise<leetcoders | null>} A promise that resolves to the suspended Leetcoder object,
 *                                       or null if the suspension fails.
 */
export const suspendLeetcoder = async (leetcoderId: string): Promise<leetcoders | null> => {
  try {
    const suspendedLeetcoder = await db.leetcoders.update({
      where: { id: leetcoderId },
      data: {
        status: 'SUSPENDED',
        is_notified: true, // Ensure is_notified is true when suspended
      },
    })

    // Update submissions for the suspended Leetcoder
    await db.submissions.updateMany({
      where: { user_id: leetcoderId },
      data: { solved: false },
    })

    return suspendedLeetcoder
  } catch (error) {
    console.error('Error suspending leetcoder:', error)
    return null
  }
}
