'use client'

import { TableData } from '@/utils/generateTableData'
import { leetcoders } from '@prisma/client'
import { TrackTable } from '@/app/g/[groupId]/track-table'
import { useSubmitDailyProblem } from '@/hooks/use-submit-daily-problem'

const TrackView = ({
  tableData,
  leetcoders,
  userId,
  groupId,
}: {
  tableData: TableData
  leetcoders: leetcoders[]
  userId?: string
  groupId: number
}) => {
  const { submitDailyProblem } = useSubmitDailyProblem()

  return (
    <main className="mx-auto max-w-screen-xl py-5">
      <TrackTable
        tableData={tableData}
        leetcoders={leetcoders}
        userId={userId}
        onSubmit={submitDailyProblem}
        groupId={groupId}
      />
    </main>
  )
}

export { TrackView }
