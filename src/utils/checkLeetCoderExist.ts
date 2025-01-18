import { fetcherGql } from '@/utils/graphFetcher'

export const checkLeetCodeUserExists = async (username: string): Promise<boolean> => {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
      }
    }
  `
  const variables = {
    username: username,
  }

  try {
    const data = await fetcherGql<{ data: { matchedUser: { username: string } | null } }>(
      '/api/graph',
      'POST',
      { query, variables }
    )
    return data?.data.matchedUser !== null
  } catch (error) {
    console.error('Error checking LeetCode user:', error)
    return false
  }
}
