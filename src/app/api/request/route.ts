import { ZodError } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

import { LeetcoderInsert } from '@/types/supabase.type'
import { LeetcoderInsertSchema } from '@/types/schema/leetcoder.schema'
import {
  approveLeetcoder,
  insertLeetcoder,
} from '@/db/supabase/services/leetcoder.service'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LeetcoderInsert
    body.group_no = Number(body.group_no)

    const validatedData = LeetcoderInsertSchema.parse(body)

    const data = await insertLeetcoder(validatedData)

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

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      )
    }

    if (
      error instanceof Error &&
      error.message === 'You are already registered.'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 409 }
      )
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
    console.log('approveLeetcoder data:', data)

    return NextResponse.json(
      {
        success: true,
        data: data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('/api/request PUT API Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
