// import { getRoadmap } from '@/hooks/get-roadmap'

// import RoadmapView from '@/components/views/roadmap-view'

import { notFound } from 'next/navigation'

const RoadmapPage = async () => {
  // const roadmap = await getRoadmap()
  return notFound()
  // return <RoadmapView roadmap={roadmap} />
}

export default RoadmapPage
