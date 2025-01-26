import { NextResponse } from 'next/server'
import { roadmap } from '@prisma/client'

import prisma from '@/prisma/prisma'
import { getCachedRoadmap, updateCachedRoadmap } from '@/utils/redis'

export async function GET() {
  try {
    const cachedData = await getCachedRoadmap()
    console.log('cachedData')
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    await prisma.$connect()

    const roadmap: roadmap[] = await prisma.roadmap.findMany({
      orderBy: {
        problem_order: 'asc', // Sort by problem_order
      },
    })
    console.log('not cached')

    // Cache the data in Edge Config
    await updateCachedRoadmap(roadmap)
    return NextResponse.json(roadmap)
  } catch (error) {
    console.error('Error fetching roadmap data:', error)
    return NextResponse.json({ error: 'Failed to fetch roadmap data' }, { status: 500 })
  }
}
