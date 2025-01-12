import { submissions } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { addCheckSubmission } from '@/models/dao/submissions.dao'
// import { insertCheckSubmission } from '@/db/supabase/services/submission.service'
// import { fetchLeetcoder } from '@/db/supabase/services/leetcoder.service'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as submissions
    body.group_no = Number(body.group_no)

    // const { lc_username } = await fetchLeetcoder(body.user_id)
    // console.log('lc_username', lc_username)

    // const hasSolvedDailyProblem = await validateDailyProblemSolved(
    //   lc_username.lc_username as string,
    //   body.problem_id
    // )
    // if (!hasSolvedDailyProblem) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: 'User has not solved the daily problem',
    //     },
    //     { status: 400 }
    //   )
    // }
    // console.log('User has solved the daily problem:', lc_username.lc_username)

    const data = await addCheckSubmission(body)
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
