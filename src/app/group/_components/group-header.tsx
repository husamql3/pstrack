import { api } from '@/trpc/server'

import { UserAuth } from '@/app/_components/user-auth'
import { RequestToJoin } from '@/app/group/_components/request-to-join'
import { Header } from '@/app/_components/header'

export const GroupHeader = async ({ groupNo }: { groupNo: string }) => {
  const user = await api.auth.getUser()

  // Only check if user is a leetcoder if the user exists
  const isExisting = user ? await api.leetcoders.checkLeetcoder({ id: user.id }) : false

  return (
    <Header>
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Group {groupNo.padStart(2, '0')}</h1>
      </div>

      <div className="flex items-center gap-3">
        {user && !isExisting && <RequestToJoin groupId={groupNo} />}
        <UserAuth />
      </div>
    </Header>
  )
}
