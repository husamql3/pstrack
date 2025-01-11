'use client'

import { TableData } from '@/utils/generateTableData'
import { leetcoders } from '@prisma/client'
import TrackTable from '@/app/g/[groupId]/track-table'

const TrackView = ({
  tableData,
  leetcoders,
}: {
  tableData: TableData
  leetcoders: leetcoders[]
}) => {
  return (
    <main className="mx-auto max-w-screen-xl py-5">
      <TrackTable
        tableData={tableData}
        leetcoders={leetcoders}
      />
    </main>
  )
}

export { TrackView }
