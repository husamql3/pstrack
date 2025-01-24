import { generateTableData } from '@/utils/generateTableData'
import { fetchGroupData } from '@/prisma/dao/groups.dao'
import { fetchRoadmap } from '@/prisma/dao/roadmap.dao'
import { getUser } from '@/hooks/get-user'

import { TrackView } from '@/components/track/track-view'
import { ConfettiFireworks } from '@/components/components/confetti-fireworks'

const Page = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const groupId = Number((await params).groupId)
  const user = await getUser()

  const groupData = await fetchGroupData(groupId)
  if (!groupData) return null

  // todo: update this on RELEASE
  const roadmap = await fetchRoadmap(groupData.group_progress)
  // const roadmap = await fetchRoadmap([])

  // if the group does not start yet, return message
  if (roadmap.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="max-w-lg px-3 text-center text-base font-medium md:px-0 md:text-2xl">
          We&apos;re preparing something amazing for you! Stay tuned, and thanks for your
          patience. 😉❤️
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
  console.log('tableData', tableData)

  return (
    <>
      <TrackView
        tableData={tableData}
        leetcoders={groupData.leetcoders}
        userId={user?.id}
        groupId={groupId}
      />

      <ConfettiFireworks />
    </>
  )
}

export default Page
