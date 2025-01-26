import { getRoadmap } from '@/hooks/get-roadmap'

import RoadmapView from '@/components/views/roadmap-view'

const RoadmapPage = async () => {
  const roadmap = await getRoadmap()

  return <RoadmapView roadmap={roadmap} />
}

export default RoadmapPage
