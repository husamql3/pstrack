import { api } from '@/trpc/server'
import { generateTableData } from '@/utils/generateTableData'

import { TrackTable } from '@/app/group/_components/track-table'

const Page = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params

  const groupData = await api.groups.getGroupTableData({ group_no: groupId })
  const roadmap = await api.roadmap.getGroupProblems(groupData?.group_progress || [])

  if (!groupData || !roadmap || roadmap.length === 0) {
    return <div className="flex-1">No problems found for this group.</div>
  }

  const tableData = generateTableData({
    group_no: groupData.group_no,
    submission: groupData.submissions,
    roadmap,
    group_progress: groupData.group_progress,
  })

  return (
    <TrackTable
      leetcoders={groupData.leetcoders}
      tableData={tableData}
      groupId={groupId}
    />
  )
}

export default Page
