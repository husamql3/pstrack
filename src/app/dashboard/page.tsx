import { api } from '@/trpc/server'

import { DashboardTable } from '@/app/dashboard/_components/dashboard-table'

const Page = async () => {
  const leetcoders = await api.leetcoders.getAllLeetcoders()
  const groups = await api.groups.getAllGroups()

  return (
    <div className="container mx-auto py-6">
      <div className="bg-card rounded-lg border">
        <DashboardTable
          leetcoders={leetcoders}
          groups={groups}
        />
      </div>
    </div>
  )
}

export default Page
