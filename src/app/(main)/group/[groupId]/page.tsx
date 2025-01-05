import { getUser } from '@/hooks/get-user'

import { TrackHeader } from '@/components/track/track-header'
import { TrackView } from '@/components/track/track-view'
import { fetchGroupLeetcoders } from '@/db/supabase/services/leetcoder.service'
import { generateData, TableData } from '@/data/generateData'
import { fetchGroupSubmissions } from '@/db/supabase/services/submission.service'
import { fetchRoadmap } from '@/db/supabase/services/roadmap.service'
import { fetchGroupProgress } from '@/db/supabase/services/progress.service'

const TrackPage = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const groupId = Number((await params).groupId)
  const user = await getUser()

  const leetcoders = await fetchGroupLeetcoders(groupId)
  const submissions = await fetchGroupSubmissions(groupId)
  const roadmap = await fetchRoadmap()
  const groupProgress = await fetchGroupProgress(groupId)

  const data: TableData = generateData({
    group_no: +groupId,
    roadmap: roadmap,
    submission: submissions,
    group_progress: groupProgress,
  })

  return (
    <>
      <TrackHeader
        user={user!}
        groupId={groupId}
      />

      <TrackView
        userId={user?.id}
        leetcoders={leetcoders}
        tableData={data}
      />
    </>
  )
}

export default TrackPage
