import { api } from '@/trpc/server'

import { DashboardTable } from '@/app/dashboard/_components/dashboard-table'

const Page = async () => {
  const leetcoders = await api.leetcoders.getAllLeetcoders()
  const groups = await api.groups.getAllGroups()

  // add button to validate cache for roadmap

  return (
    <div className="container mx-auto py-6">
      <DashboardTable
        leetcoders={leetcoders}
        groups={groups}
      />
    </div>
  )
}

export default Page
