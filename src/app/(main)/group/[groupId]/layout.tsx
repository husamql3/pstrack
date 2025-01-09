import { getUser } from '@/hooks/get-user'

import { TrackHeader } from '@/components/track/track-header'

export async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ groupId: string }>
}) {
  const user = await getUser()
  const groupId = Number((await params).groupId)

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

export default GroupLayout
