import { api } from '@/trpc/server'
import { generateTableData } from '@/utils/generateTableData'
// import { redis } from '@/config/redis'
// import type { GroupData } from '@/types/tableRow.type'
// import type { roadmap } from '@prisma/client'
import { NOT_STARTED_GROUPS } from '@/data/constants'

import { TrackTable } from '@/app/group/_components/track-table'
import { ConfettiFireworks } from '@/app/group/_components/confetti-fireworks'
import { NotStarted } from '@/app/group/_components/not-started'

// type CachedData = {
//   groupData: GroupData
//   roadmap: roadmap[]
// }

const Page = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params

  // for not started groups
  if (NOT_STARTED_GROUPS.includes(+groupId)) return <NotStarted />

  // const user = await api.auth.getUser()
  // console.log('user?.user_metadata', user?.user_metadata)
  const groupData = await api.groups.getGroupTableData({ group_no: groupId })
  const roadmap = await api.roadmap.getGroupProblems(groupData?.group_progress || [])

  // const cacheKey = `group:${groupId}:data`
  // let groupData: GroupData | null = null
  // let roadmap: roadmap[] = []

  // const cachedData = (await redis.get(cacheKey)) as CachedData | null

  // if (cachedData) {
  //   console.log('##### Cached data found')
  //   groupData = cachedData.groupData
  //   roadmap = cachedData.roadmap
  // } else {
  //   console.log('##### No cached data found')
  //   groupData = await api.groups.getGroupTableData({ group_no: groupId })
  //   roadmap = await api.roadmap.getGroupProblems(groupData?.group_progress || [])

  //   if (groupData && roadmap) {
  //     await redis.set(cacheKey, { groupData, roadmap }, { ex: 180 }) // cache for 3 minutes
  //   }
  // }

  if (!groupData || !roadmap || roadmap.length === 0) return <NotStarted />

  const tableData = generateTableData({
    group_no: groupData.group_no,
    submission: groupData.submissions,
    roadmap,
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
