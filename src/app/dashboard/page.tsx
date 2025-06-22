import { DashboardTable } from '@/app/dashboard/_components/dashboard-table'
import { api } from '@/trpc/server'

const Page = async () => {
  const leetcoders = await api.leetcoders.getAllLeetcoders()
  const groups = await api.groups.getAllGroups()

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Leetcoders Management</h1>
      <DashboardTable
        leetcoders={leetcoders}
        groups={groups}
      />
    </div>
  )
}

export default Page
