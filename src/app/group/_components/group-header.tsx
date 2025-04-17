// todo: update group no style

import { Suspense } from 'react'

import { UserAuth } from '@/app/_components/user-auth'
import { RequestToJoin } from '@/app/group/_components/request-to-join'

export const GroupHeader = ({ groupNo }: { groupNo: string }) => {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 pt-5 pb-2">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Group {groupNo.padStart(2, '0')}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Suspense fallback={null}>
          <RequestToJoin groupId={groupNo} />
        </Suspense>

        <UserAuth />
      </div>
    </header>
  )
}
