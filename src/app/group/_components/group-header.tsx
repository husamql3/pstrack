import { Suspense } from 'react'

import { api } from '@/trpc/server'
import { MAX_LEETCODERS } from '@/data/constants'

import { UserAuth } from '@/app/_components/user-auth'
import { Header } from '@/app/_components/header'
import { RequestModal } from '@/app/group/_components/request-modal'
import { NavMenu } from '@/app/_components/nav-menu'
import { GradientText } from '@/ui/gradient'

export const GroupHeader = async ({ groupNo }: { groupNo: string }) => {
  const user = await api.auth.getUser()
  const leetcodersCount = await api.groups.getGroupLeetcodersCount()
  const isFull = leetcodersCount >= MAX_LEETCODERS

  return (
    <Header className="max-w-6xl">
      <div className="flex items-center">
        <GradientText
          className="text-xl font-bold sm:text-2xl"
          text={
            <>
              <span className="sm:hidden">G</span>
              <span className="hidden sm:inline">Group</span>{' '}
              <span>#{groupNo.padStart(2, '0')}</span>
            </>
          }
        />
      </div>

      <NavMenu />

      <div className="flex items-center gap-3">
        {!isFull && (
          <Suspense fallback={null}>
            <RequestModal groupId={groupNo} />
          </Suspense>
        )}
        <UserAuth user={user} />
      </div>
    </Header>
  )
}
