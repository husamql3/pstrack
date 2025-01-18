import { type submissions } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { addCheckSubmission } from '@/prisma/dao/submissions.dao'
import { validateDailyProblemSolved } from '@/utils/checkLeetCoderSolved'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as submissions & {
      lc_username: string
      problem_slug: string
    }

    const { lc_username, problem_slug, ...submission } = body
    body.group_no = Number(body.group_no)

    // Check if the user has solved the problem before submitting
    const hasSolved = await validateDailyProblemSolved({
      lc_username: lc_username,
      problem_slug: problem_slug,
    })

    if (!hasSolved) {
      return NextResponse.json(
        {
          success: false,
          error: 'User has not solved the problem',
        },
        { status: 400 }
      )
    }

    const data = await addCheckSubmission(submission)
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
