import { NextResponse } from 'next/server'
import { fetcher } from '@/utils/graphFetcher'
import { env } from 'process'

export async function POST(req: Request) {
  try {
    const { query, variables } = await req.json()
    const data = await fetcher<{ data: { matchedUser: { username: string } | null } }>(
      env.LEETCODE_API_URL as string,
      'POST',
      { query, variables }
    )

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error in /api/leetcode POST API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data from LeetCode' },
      { status: 500 }
    )
  }
}
