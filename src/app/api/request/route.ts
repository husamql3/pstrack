import { ZodError } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

import { LeetcoderInsertSchema } from '@/types/schema/leetcoder.schema'
import { LeetcoderRequest } from '@/types/leetcoder.type'
import { checkLeetCodeUserExists } from '@/utils/checkLeetCoderExist'
import { addLeetcoder, approveLeetcoder, isUsernameExist } from '@/prisma/dao/leetcoders.dao'
import { sendApproveEmail } from '@/utils/email/sendApproveEmail'
import { sendAdminEmail } from '@/utils/email/sendAdminEmail'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    body.group_no = Number(body.group_no)

    // Validate the data
    const validatedData = LeetcoderInsertSchema.parse(body)

    // Check if the LeetCode user exists
    const leetCodeUserExists = await checkLeetCodeUserExists(validatedData.lc_username)
    if (!leetCodeUserExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'LeetCode user does not exist.',
        },
        { status: 400 }
      )
    }

    // Check if the username already exist
    const usernameExist = await isUsernameExist(body.username)
    console.log(usernameExist)
    if (usernameExist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username already exist.',
        },
        { status: 409 }
      )
    }

    const data = await addLeetcoder(body.id, validatedData as LeetcoderRequest)

    console.log('insertLeetcoder data:', data)
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('/api/request POST API Error:', error)
    await sendAdminEmail(error, 'PUT /api/request - Email Sending')

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === 'You are already registered.') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 }
        )
      } else if (error.message === 'Username already exist.') {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing id',
        },
        { status: 400 }
      )
    }

    const data = await approveLeetcoder(id)

    sendApproveEmail({
      to: data.email,
      username: data.name,
      group_no: String(data.group_no),
    })

    return NextResponse.json(
      {
        success: true,
        data: data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('/api/request PUT API Error:', error)
    await sendAdminEmail(error, 'PUT /api/request - Email Sending')
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
