'use client'

import { TrackTable } from '@/components/track/track-table'
import { TableData } from '@/data/generateData'
import { getColumns } from '@/components/track/track-columns'
import { LeetcoderRow } from '@/types/supabase.type'

const TrackView = async ({
  userId,
  leetcoders,
  tableData,
}: {
  userId: string | undefined
  leetcoders: LeetcoderRow[]
  tableData: TableData
}) => {
  return (
    <main className="mx-auto max-w-screen-xl py-5">
      <TrackTable
        columns={getColumns(userId ?? undefined, leetcoders)}
        data={tableData}
      />
    </main>
  )
}

export { TrackView }
