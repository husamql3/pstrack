import { generateTableData } from '@/utils/generateTableData'
import { fetchGroupData } from '@/models/dao/groups.dao'
import { fetchRoadmap } from '@/models/dao/roadmap.dao'

import { TrackView } from '@/app/g/[groupId]/track-view'
import { getUser } from '@/hooks/get-user'

const Page = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const groupId = Number((await params).groupId)
  const user = await getUser()

  const groupData = await fetchGroupData(groupId)
  const roadmap = await fetchRoadmap()
  if (!groupData) return null

  const tableData = generateTableData({
    group_no: groupData.group_no,
    submission: groupData.submissions,
    roadmap: roadmap,
    group_progress: groupData.group_progress,
  })
  // console.log(tableData)

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
