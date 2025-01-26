import { NextResponse } from 'next/server'

import prisma from '@/prisma/prisma'
import { getCachedRoadmap, updateCachedRoadmap } from '@/lib/edge-config'

export async function GET() {
  try {
    // Check if data is cached in Edge Config
    const cachedData = await getCachedRoadmap()
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    await prisma.$connect()

    // Fetch data from the database
    const data = await prisma.roadmap.findMany({
      orderBy: {
        problem_order: 'asc', // Sort by problem_order
      },
    })

    // Cache the data in Edge Config
    await updateCachedRoadmap(data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching roadmap data:', error)
    return NextResponse.json({ error: 'Failed to fetch roadmap data' }, { status: 500 })
  }
}
