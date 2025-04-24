import { Suspense } from 'react'

import { api } from '@/trpc/server'

import { UserAuth } from '@/app/_components/user-auth'
import { Header } from '@/app/_components/header'
import { RequestModal } from '@/app/group/_components/request-modal'

export const GroupHeader = async ({ groupNo }: { groupNo: string }) => {
  const user = await api.auth.getUser()

  return (
    <Header className="max-w-6xl">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Group {groupNo.padStart(2, '0')}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Suspense fallback={null}>
          <RequestModal groupId={groupNo} />
        </Suspense>
        <UserAuth user={user} />
      </div>
    </Header>
  )
}
