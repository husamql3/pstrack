import { Leetcoders } from '@/types/leetcoder.type'
import { fetchPendingLeetcoders } from '@/prisma/dao/leetcoders.dao'

import { requestsColumns } from '@/components/requests/columns'
import { RequestsTable } from '@/components/requests/requests-table'

const DashboardView = async () => {
  const requestsData: Leetcoders[] = await fetchPendingLeetcoders()
  console.log(requestsData)

  return (
    <div className="h-svh w-full p-5">
      <RequestsTable
        columns={requestsColumns}
        data={requestsData}
      />
    </div>
  )
}

export default DashboardView
