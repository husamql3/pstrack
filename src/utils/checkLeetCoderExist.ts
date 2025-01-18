import { userProfile } from '@/lib/graphql/userProfile'

export const checkLeetCodeUserExists = async (username: string): Promise<boolean> => {
  console.log('checkLeetCodeUserExists')
  const payload = {
    query: userProfile,
    variables: { username: username },
  }

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    console.log('response', response)

    if (!response.ok) {
      throw new Error('Error checking LeetCode user.')
    }

    const data = await response.json()
    console.log('data', data)
    return data.data.matchedUser !== null
  } catch (error) {
    console.error('Error checking LeetCode user:', error)
    return false
  }
}
