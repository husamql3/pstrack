import { getUser } from '@/hooks/get-user'

import { fetchGroupLeetcoders } from '@/db/supabase/services/leetcoder.service'
import { generateTableData } from '@/utils/generateTableData'
import { fetchGroupSubmissions } from '@/db/supabase/services/submission.service'
import { fetchRoadmap } from '@/db/supabase/services/roadmap.service'
import { fetchGroupProgress } from '@/db/supabase/services/progress.service'
import { TableData } from '@/types/trackTable.type'

import { TrackView } from '@/components/track/track-view'

const TrackPage = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const groupId = Number((await params).groupId)
  const user = await getUser()

  const leetcoders = await fetchGroupLeetcoders(groupId)
  const submissions = await fetchGroupSubmissions(groupId)
  const roadmap = await fetchRoadmap()
  const groupProgress = await fetchGroupProgress(groupId)

  const data: TableData = generateTableData({
    group_no: +groupId,
    roadmap: roadmap,
    submission: submissions,
    group_progress: groupProgress,
  })
  // console.log('tableData:', data)

  return (
    <>
      <TrackView
        userId={user?.id}
        leetcoders={leetcoders}
        tableData={data}
        groupId={groupId}
      />
    </>
  )
}

export default TrackPage
