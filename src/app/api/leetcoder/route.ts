import { NextRequest, NextResponse } from 'next/server'

import {
  getLeetcoder,
  getLeetcoders,
} from '@/db/supabase/services/leetcoder.service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    const data = id ? await getLeetcoder(id) : await getLeetcoders()

    console.log('getLeetcoder data:', data)
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('/api/leetcoder GET API Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
