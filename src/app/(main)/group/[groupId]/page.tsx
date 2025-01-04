import { getUser } from '@/hooks/get-user'

import { TrackHeader } from '@/components/track/track-header'

const TrackPage = async ({
  params,
}: {
  params: Promise<{ groupId: string }>
}) => {
  const groupId = (await params).groupId
  const user = await getUser()

  return (
    <div>
      <TrackHeader
        user={user!}
        groupId={groupId}
      />
      {/* Main Content */}
      <main>.</main>
    </div>
  )
}

export default TrackPage

// import {
// getUser
// }
// from
// '@/hooks/get-user'
// import { getProblems } from '@/db/supabase/services/problem.service'
// import { getLeetcoders } from '@/db/supabase/services/leetcoder.service'
//
// import GroupView from '@/components/views/group-view'
//
// const GroupPage = async ({
//   params,
// }: {
//   params: Promise<{ groupId: string }>
// }) => {
//   const groupId = (await params).groupId
//   const user = await getUser()
//   const problems = (await getProblems()) ?? []
//   const leetcoders = (await getLeetcoders()) ?? []
//
//   return (
//     <GroupView
//       user={user!}
//       problems={problems}
//       leetcoders={leetcoders}
//       groupId={groupId}
//     />
//   )
// }
//
// export default GroupPage
