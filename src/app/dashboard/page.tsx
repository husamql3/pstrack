import { api } from '@/trpc/server'

import { DashboardTable } from '@/app/dashboard/_components/dashboard-table'

const Page = async () => {
  const leetcoders = await api.leetcoders.getAllLeetcoders()

  return (
    <div className="flex h-fit items-center justify-center">
      <DashboardTable leetcoders={leetcoders} />
    </div>
  )
}

export default Page
