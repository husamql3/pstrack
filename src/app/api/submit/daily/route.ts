import { NextRequest, NextResponse } from 'next/server'

import { SubmissionInsert } from '@/types/supabase.type'
import { insertCheckSubmission } from '@/db/supabase/services/submission.service'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubmissionInsert
    body.group_no = Number(body.group_no)

    const data = await insertCheckSubmission(body)

    console.log('/api/submit/daily POST body:', body)
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('/api/submit/daily POST API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
