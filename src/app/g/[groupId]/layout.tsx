import { Suspense } from 'react'
import { notFound } from 'next/navigation'

import { getUser } from '@/hooks/get-user'
import { checkGroupExists } from '@/models/dao/groups.dao'

import { TrackHeader } from '@/components/track/track-header'
import { TableSkeleton } from '@/components/track/table-skeleton'
import { isLeetcoderApproved } from '@/models/dao/leetcoders.dao'

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ groupId: string }>
}) => {
  const groupId = Number((await params).groupId)

  // check if group exists before rendering the layout
  const groupExists = await checkGroupExists(groupId)
  if (!groupExists) notFound()

  const user = await getUser()
  const isApproved = await isLeetcoderApproved(user?.id as string)

  return (
    <div className="h-svh w-svw">
      <TrackHeader
        groupId={groupId}
        user={user!}
        isApproved={isApproved}
      />

      <Suspense fallback={<TableSkeleton />}>{children}</Suspense>
    </div>
  )
}

export default Layout
