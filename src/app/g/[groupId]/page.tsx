import { generateTableData } from '@/utils/generateTableData'
import { fetchGroupData } from '@/prisma/dao/groups.dao'
import { fetchRoadmap } from '@/prisma/dao/roadmap.dao'
import { getUser } from '@/hooks/get-user'

import { TrackView } from '@/components/track/track-view'

const Page = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const groupId = Number((await params).groupId)
  const user = await getUser()

  const groupData = await fetchGroupData(groupId)
  if (!groupData) return null

  const roadmap = await fetchRoadmap(groupData.group_progress.current_problem!)

  const tableData = generateTableData({
    group_no: groupData.group_no,
    submission: groupData.submissions,
    roadmap: roadmap,
    group_progress: groupData.group_progress,
  })
  console.log(tableData)

  return (
    <TrackView
      tableData={tableData}
      leetcoders={groupData.leetcoders}
      userId={user?.id}
      groupId={groupId}
    />
  )
}

export default Page
