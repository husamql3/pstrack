import { ZodError } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

import { RequestInsertSchema } from '@/types/schema/request.schema'
import { insertRequest } from '@/db/supabase/services/request.service'
import { RequestInsert } from '@/types/supabase.type'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestInsert
    body.group_no = Number(body.group_no)

    const validatedData = RequestInsertSchema.parse(body)

    const data = await insertRequest(validatedData)

    console.log('insertRequest data:', data)
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
          error: JSON.stringify(error.errors),
        },
        { status: 400 }
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
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  return NextResponse.json(
    {
      success: true,
      data: id,
    },
    { status: 201 }
  )
}
