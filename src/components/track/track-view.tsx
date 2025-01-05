'use client'

import { LeetcoderRow } from '@/types/supabase.type'
import { TableData } from '@/types/trackTable.type'

import { TrackTable } from '@/components/track/track-table'
import { getColumns } from '@/components/track/track-columns'

const TrackView = ({
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
