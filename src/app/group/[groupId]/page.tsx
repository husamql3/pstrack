'use client'

import { use } from 'react'
import { ConfettiFireworks } from '@/app/group/_components/confetti-fireworks'
import { NotStarted } from '@/app/group/_components/not-started'
import { TrackTable } from '@/app/group/_components/track-table'
import { NOT_STARTED_GROUPS } from '@/data/constants'
import { api } from '@/trpc/react'
import { generateTableData } from '@/utils/generateTableData'

const Page = ({ params }: { params: Promise<{ groupId: string }> }) => {
  const { groupId } = use(params)

  // for not started groups
  if (NOT_STARTED_GROUPS.includes(+groupId)) return <NotStarted />

  // Enhanced caching for group data - cache for 5 minutes
  // This will be invalidated when submissions are made
  const { data: groupData, isLoading: groupDataLoading } = api.groups.getGroupTableData.useQuery(
    { group_no: groupId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    }
  )

  const { data: groupProblems, isLoading: groupProblemsLoading } = api.roadmap.getGroupProblems.useQuery(
    groupData?.group_progress || [],
    {
      enabled: !!groupData?.group_progress,
      staleTime: 10 * 60 * 1000, // 10 minutes for problems (they change less frequently)
    }
  )

  // Show loading state
  if (groupDataLoading || groupProblemsLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center">Loading...</div>
  }

  if (!groupData || !groupProblems || groupProblems.length === 0) return <NotStarted />

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
