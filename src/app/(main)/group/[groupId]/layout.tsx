import { notFound } from 'next/navigation'

import { getUser } from '@/hooks/get-user'
import { TrackHeader } from '@/components/track/track-header'
import { checkGroupExists } from '@/db/supabase/services/group.service'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ groupId: string }>
}) {
  const user = await getUser()
  const groupId = Number((await params).groupId)
  const groupExists = await checkGroupExists(groupId)

  if (!groupExists) notFound()

  return (
    <div className="h-svh w-svw">
      <TrackHeader
        groupId={groupId}
        user={user!}
      />
      {children}
    </div>
  )
}
