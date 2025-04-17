import { api } from '@/trpc/server'

import { UserAuth } from '@/app/_components/user-auth'
import { RequestToJoin } from '@/app/group/_components/request-to-join'

export const GroupHeader = async ({ groupNo }: { groupNo: string }) => {
  const user = await api.auth.getUser()
  const isExisting = await api.leetcoders.checkLeetcoder({ id: user?.id as string })

  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 pt-5 pb-2">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Group {groupNo.padStart(2, '0')}</h1>
      </div>

      <div className="flex items-center gap-3">
        {user && !isExisting && <RequestToJoin groupId={groupNo} />}

        <UserAuth />
      </div>
    </header>
  )
}
