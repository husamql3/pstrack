import { LeetcodeRowType } from '@/types/supabase.type'
import { fetchPendingLeetcoders } from '@/db/supabase/services/leetcoder.service'

import { requestsColumns } from '@/components/requests/columns'
import { RequestsTable } from '@/components/requests/requests-table'

const DashboardView = async () => {
  const requestsData: LeetcodeRowType = (await fetchPendingLeetcoders()) ?? []

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
