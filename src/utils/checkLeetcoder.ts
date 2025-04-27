import { LEETCODE_GQL_BASE_URL } from '@/data/constants'
import { userProfile } from '@/data/queries/userProfile.gql'

/**
 * Validates if a LeetCode username exists
 *
 * @param {string} username - The LeetCode username to validate
 * @returns {Promise<boolean>} True if the username exists, false otherwise
 */
export const checkLCUsername = async (username: string): Promise<boolean> => {
  const payload = {
    query: userProfile,
    variables: { username: username },
  }

  try {
    const response = await fetch(LEETCODE_GQL_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const errorMsg = `HTTP error! status: ${response.status}`
      console.error(errorMsg)
      return false
    }

    const data = await response.json()
    return data.data?.matchedUser !== null
  } catch (error) {
    console.error('Error checking LeetCode user:', error)
    return false
  }
}

/**
 * Validates if a GitHub username exists
 *
 * @param {string} username - The GitHub username to validate
 * @returns {Promise<boolean>} True if the username exists, false otherwise
 */
export const checkGHUsername = async (username: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`)
    if (!response.ok) {
      const errorMsg = `GitHub user not found: ${response.status}`
      console.error(errorMsg)
      return false
    }
    return true
  } catch (error) {
    console.error('Error checking GitHub user:', error)
    return false
  }
}
