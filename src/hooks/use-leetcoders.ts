import { LeetCoder } from '@/types/table.type'

export const useLeetcoders = async (): Promise<LeetCoder[]> => {
  try {
    const response = await fetch('/api/leetcoder', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) throw new Error('Failed to fetch leetcoders')

    return await response.json()
  } catch (error) {
    console.error('Error fetching leetcoders:', error)
    throw error
  }
}
