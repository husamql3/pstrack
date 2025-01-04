import { RequestsTable } from '@/components/requests/requests-table'
import { LeetcoderRow } from '@/types/supabase.type'
import { requestsColumns } from '@/components/requests/columns'

const DashboardView = () => {
  const requestsData: LeetcoderRow[] = [
    {
      created_at: '2023-01-01T00:00:00.000Z',
      id: 'f07e0ca7-4a29-4f7d-9e39-220f95f204b9',
      name: 'Hüsam',
      username: 'husamahmud',
      email: 'husamahmud@gmail.com',
      status: 'pending',
      group_no: 1,
      gh_username: null,
      lc_username: null,
    },
    {
      created_at: '2023-01-01T00:00:00.000Z',
      id: 'f07e0ca7-4a29-4f7d-9e39-220f95f204b9',
      name: 'Sebastian',
      username: 'husamahmud',
      email: 'husamahmud@gmail.com',
      status: 'pending',
      group_no: 1,
      gh_username: null,
      lc_username: null,
    },
  ]

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
