import { Suspense } from 'react'
import { LucideMousePointer2 } from 'lucide-react'

import { api } from '@/trpc/server'
import { redis } from '@/config/redis'

import { Roadmap, type RoadmapType } from '@/app/(public)/roadmap/_components/roadmap'
import { StarsBackground } from '@/ui/stars-background'

const Page = async () => {
  const cacheKey = 'roadmap:data'
  let roadmapData: RoadmapType[] = []

  const cachedData = (await redis.get(cacheKey)) as RoadmapType[] | null
  if (cachedData) {
    roadmapData = cachedData
  } else {
    roadmapData = await api.roadmap.getRoadmap()
    if (roadmapData) {
      await redis.set(cacheKey, roadmapData, { ex: 604800 }) // cache for one week
    }
  }

  return (
    <>
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <StarsBackground className="fixed inset-0 -z-10" />
      </Suspense>

      <div className="mx-auto flex w-full max-w-4xl flex-col py-10">
        <h1 className="text-4xl font-bold">
          Our Roadmap
          <a
            href="https://neetcode.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-sm font-medium transition-all duration-200 hover:underline"
          >
            from NeetCode
          </a>
        </h1>

        <div className="mb-4 flex gap-1">
          <LucideMousePointer2 className="size-5" />
          <p className="font-medium text-zinc-300">
            Select a topic to explore its practice problems!
          </p>
        </div>

        <Roadmap roadmap={roadmapData} />
      </div>
    </>
  )
}

export default Page
