'use client'

import { useSubmitDailyProblem } from '@/hooks/use-submit-daily-problem'
import { TrackViewProps } from '@/types/trackViewProps.type'

import { TrackTable } from '@/components/track/track-table'

const TrackView = ({ tableData, leetcoders, userId, groupId }: TrackViewProps) => {
  const { submitDailyProblem } = useSubmitDailyProblem()

  return (
    <main className="mx-auto w-full max-w-screen-xl py-5">
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
