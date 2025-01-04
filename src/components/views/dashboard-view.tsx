import { RequestsTable } from '@/components/requests/requests-table'
import { RequestRow } from '@/types/supabase.type'
import { requestsColumns } from '@/components/requests/columns'

const DashboardView = () => {
  const requestsData: RequestRow[] = [
    {
      created_at: '2023-01-01T00:00:00.000Z',
      id: 'b3d654d8-91e7-4d56-b70e-5f9a879809de',
      name: 'Hüsam',
      username: 'husamahmud',
      email: 'husamahmud@gmail.com',
      status: 'pending',
      group_no: 1,
      user_id: 'f07e0ca7-4a29-4f7d-9e39-220f95f204b9',
      gh_username: null,
      lc_username: null,
    },
    {
      created_at: '2023-01-01T00:00:00.000Z',
      id: 'b3d654d8-91e7-4d56-b70e-5f9a879809de',
      name: 'Sebastian',
      username: 'husamahmud',
      email: 'husamahmud@gmail.com',
      status: 'pending',
      group_no: 1,
      user_id: 'f07e0ca7-4a29-4f7d-9e39-220f95f204b9',
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
