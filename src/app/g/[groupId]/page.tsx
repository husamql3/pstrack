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

  // todo: update this on RELEASE
  const roadmap = await fetchRoadmap(0!)

  // if the group does not started yet, return message
  if (roadmap.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-center text-2xl font-semibold">
          We&apos;re preparing something amazing for you! <br />
          Stay tuned, and thanks for your patience. 😉❤️
        </h1>
      </div>
    )
  }

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
