import { api } from '@/trpc/server'

import { UserAuth } from '@/app/_components/user-auth'
import { Header } from '@/app/_components/header'
import { NavMenu } from '@/app/_components/nav-menu'
import { GradientText } from '@/ui/gradient'

export const GroupHeader = async ({ groupNo }: { groupNo: string }) => {
  const user = await api.auth.getUser()

  // todo: update group header style https://animate-ui.com/docs/text/highlight
  return (
    <Header className="max-w-none sm:px-10">
      <div className="flex items-center">
        <GradientText
          className="text-xl font-bold sm:text-2xl"
          text={
            <>
              <span className="sm:hidden">G</span>
              <span className="hidden sm:inline">Group</span> <span>#{groupNo.padStart(2, '0')}</span>
            </>
          }
        />
      </div>

      <NavMenu />

      <UserAuth user={user} />
    </Header>
  )
}
