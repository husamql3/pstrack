import { api } from '@/trpc/server'

import { DashboardTable } from '@/app/dashboard/_components/dashboard-table'

const Page = async () => {
  const leetcoders = await api.leetcoders.getAllLeetcoders()

  return (
    <div className="flex items-center justify-center py-8">
      <DashboardTable leetcoders={leetcoders} />
    </div>
  )
}

export default Page
