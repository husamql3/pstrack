import { api } from '@/trpc/server'
import { redis } from '@/config/redis'

import { Roadmap, type RoadmapType } from '@/app/(public)/roadmap/_components/roadmap'

const Page = async () => {
  const cacheKey = 'roadmap:data'
  let roadmapData: RoadmapType[] = []

  const cachedData = (await redis.get(cacheKey)) as RoadmapType[] | null
  if (cachedData) {
    console.log('##### Cached roadmap data found')
    roadmapData = cachedData
  } else {
    console.log('##### No cached roadmap data found')
    roadmapData = await api.roadmap.getRoadmap()
    if (roadmapData) {
      await redis.set(cacheKey, roadmapData, { ex: 604800 }) // cache for one week
    }
  }

  return (
    <div className="flex-1">
      <Roadmap roadmap={roadmapData} />
    </div>
  )
}

export default Page
