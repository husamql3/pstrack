'use client'

import { TrackTable } from '@/components/track/track-table'
import { generateData } from '@/data/generateData'
import { getColumns } from '@/components/track/track-columns'

const TrackView = async ({ userId }: { userId: string | undefined }) => {
  const data = generateData()

  return (
    <main className="mx-auto max-w-screen-xl py-5">
      <TrackTable
        columns={getColumns(userId || null)}
        data={data}
      />
    </main>
  )
}

export { TrackView }
