import { getUser } from '@/hooks/get-user'

import { TrackHeader } from '@/components/track/track-header'
import { TrackView } from '@/components/track/track-view'

const TrackPage = async ({
  params,
}: {
  params: Promise<{ groupId: string }>
}) => {
  const groupId = (await params).groupId
  const user = await getUser()

  return (
    <>
      <TrackHeader
        user={user!}
        groupId={groupId}
      />

      <TrackView />
    </>
  )
}

export default TrackPage
