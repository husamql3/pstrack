import { HiCursorArrowRays } from 'react-icons/hi2'

import { api } from '@/trpc/server'

import { type RoadmapType } from '@/app/(public)/roadmap/_components/roadmap'

const Page = async () => {
  const roadmapData: RoadmapType[] = await api.roadmap.getRoadmap()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-10">
      <h1 className="mb-10 text-4xl font-bold">
        Our Roadmap
        <a
          href="https://neetcode.io/practice?tab=neetcode250"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-sm font-medium transition-all duration-200 hover:underline"
        >
          from NeetCode
        </a>
      </h1>

      <div className="mx-auto mb-4 flex gap-1">
        <HiCursorArrowRays className="size-5 text-neutral-400" />
        <p className="font-medium text-neutral-500">Select a topic to explore its practice problems!</p>
      </div>

      <Roadmap roadmap={roadmapData} />
    </div>
  )
}

export default Page
