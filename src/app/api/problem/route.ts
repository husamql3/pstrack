import { NextRequest, NextResponse } from 'next/server'

import {
  createProblem,
  deleteProblem,
  getProblem,
  getProblems,
} from '@/db/supabase/services/problem.service'
import { CreateProblemDto } from '@/types/dto/problem.dto'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    const data = id ? await getProblem(Number(id)) : await getProblems()

    console.log('getProblem data:', data)
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('/api/problem GET API Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = CreateProblemDto.parse(body)

    const data = await createProblem(validatedData)

    console.log('createProblem data:', data)
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('/api/problem POST API Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
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

    const data = await deleteProblem(Number(id))

    console.log('deleteProblem data:', data)
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('/api/problem DELETE API Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
