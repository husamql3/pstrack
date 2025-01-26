import { LandingBg } from '@/components/landing/landing-bg'
import Header from '@/components/landing/header'
import RoadmapAccordion from '@/components/roadmap/roadmap-accordion'
import { roadmap } from '@prisma/client'

import { fetchAllRoadmap } from '@/prisma/dao/roadmap.dao'

const RoadmapView = async () => {
  const roadmap: roadmap[] = await fetchAllRoadmap()
  return (
    <>
      <LandingBg />

      <div className="absolute z-10 mx-auto flex h-full w-svw flex-col">
        <Header />

        <div className="mx-auto flex h-full w-full max-w-screen-md flex-1 px-3 py-10 md:px-0">
          <RoadmapAccordion roadmaps={roadmap} />
        </div>
      </div>
    </>
  )
}

export default RoadmapView
