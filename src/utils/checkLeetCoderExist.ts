import { userProfile } from '@/lib/graphql/userProfile'
import { LEETCODE_GQL_BASE_URL } from '@/data/CONSTANTS'

export const checkLeetCodeUserExists = async (username: string): Promise<boolean> => {
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
      console.error(`HTTP error! status: ${response.status}`)
      return false
    }

    const data = await response.json()
    return data.data?.matchedUser !== null
  } catch (error) {
    console.error('Error checking LeetCode user:', error)
    return false
  }
}
