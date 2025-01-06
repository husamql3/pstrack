'use client'

import { useSubmitDailyProblem } from '@/hooks/use-submit-daily-problem'
import { TrackViewProps } from '@/types/trackViewProps.type'

import { TrackTable } from '@/components/track/track-table'
import { getColumns } from '@/components/track/track-columns'

const TrackView = ({ userId, leetcoders, tableData, groupId }: TrackViewProps) => {
  const { submitDailyProblem } = useSubmitDailyProblem()

  return (
    <main className="mx-auto max-w-screen-xl py-5">
      <TrackTable
        columns={getColumns(userId ?? undefined, leetcoders, submitDailyProblem, groupId)}
        data={tableData}
      />
    </main>
  )
}

export { TrackView }
