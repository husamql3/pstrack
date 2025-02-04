import { roadmap } from '@prisma/client'

import Header from '@/components/landing/header'
import RoadmapAccordion from '@/components/roadmap/roadmap-accordion'
import Footer from '@/components/landing/footer'

const RoadmapView = async ({ roadmap }: { roadmap: roadmap[] }) => {
  return (
    <div className="mx-auto flex h-svh w-full flex-col">
      <Header />

      <div className="mx-auto flex h-full w-full max-w-screen-md flex-1 px-3 py-10 md:px-0">
        <RoadmapAccordion roadmaps={roadmap} />
      </div>

      <Footer />
    </div>
  )
}

export default RoadmapView
