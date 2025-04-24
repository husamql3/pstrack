import { api } from '@/trpc/server'
import { generateTableData } from '@/utils/generateTableData'
import { redis } from '@/config/redis'
import type { GroupData } from '@/types/tableRow.type'
import type { roadmap } from '@prisma/client'

import { TrackTable } from '@/app/group/_components/track-table'
import { ConfettiFireworks } from '@/app/group/_components/confetti-fireworks'

type CachedData = {
  groupData: GroupData
  roadmap: roadmap[]
}

const Page = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params

  const user = await api.auth.getUser()
  console.log(user)

  const cacheKey = `group:${groupId}:data`
  let groupData: GroupData | null = null
  let roadmap: roadmap[] = []

  const cachedData = (await redis.get(cacheKey)) as CachedData | null

  if (cachedData) {
    console.log('##### Cached data found')
    groupData = cachedData.groupData
    roadmap = cachedData.roadmap
  } else {
    console.log('##### No cached data found')
    groupData = await api.groups.getGroupTableData({ group_no: groupId })
    roadmap = await api.roadmap.getGroupProblems(groupData?.group_progress || [])

    if (groupData && roadmap) {
      await redis.set(cacheKey, { groupData, roadmap }, { ex: 300 })
    }
  }

  if (!groupData || !roadmap || roadmap.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4">
        <h1 className="max-w-2xl text-center text-lg font-semibold md:text-2xl">
          Get ready! Your group&apos;s journey is being prepared. We will notify you when it&apos;s
          ready. 🔥
        </h1>
      </div>
    )
  }

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
