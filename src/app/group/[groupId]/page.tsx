import { api } from '@/trpc/server'
import { generateTableData } from '@/utils/generateTableData'
import { NOT_STARTED_GROUPS } from '@/data/constants'

import { TrackTable } from '@/app/group/_components/track-table'
import { ConfettiFireworks } from '@/app/group/_components/confetti-fireworks'
import { NotStarted } from '@/app/group/_components/not-started'

const Page = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params

  // for not started groups
  if (NOT_STARTED_GROUPS.includes(+groupId)) return <NotStarted />

  const groupData = await api.groups.getGroupTableData({ group_no: groupId })
  const groupProblems = await api.roadmap.getGroupProblems(groupData?.group_progress || [])

  if (!groupData || !groupProblems) return <NotStarted />

  const tableData = generateTableData({
    group_no: groupData.group_no,
    submission: groupData.submissions,
    roadmap: groupProblems,
    group_progress: groupData.group_progress,
  })

  return (
    <>
      <TrackTable
        leetcoders={groupData.leetcoders}
        tableData={tableData}
        groupId={groupId}
      />

      <ConfettiFireworks />
    </>
  )
}

export default Page
