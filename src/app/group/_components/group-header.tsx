import { Header } from '@/app/_components/header'
import { LinksMenu } from '@/app/_components/links-menu'
import { NavMenu } from '@/app/_components/nav-menu'
import { UserAuth } from '@/app/_components/user-auth'
import { api } from '@/trpc/server'
import { GradientText } from '@/ui/gradient'

export const GroupHeader = async ({ groupNo }: { groupNo: string }) => {
  const user = await api.auth.getUser()

  return (
    <Header className="max-w-none sm:px-10">
      <div className="flex items-center gap-3">
        <LinksMenu className="sm:hidden" />

        <GradientText
          className="text-2xl font-bold"
          text={
            <>
              <span className="sm:hidden">G</span>
              <span className="hidden sm:inline">Group</span> <span>#{groupNo.padStart(2, '0')}</span>
            </>
          }
        />
      </div>

      <NavMenu className="hidden sm:block" />

      <UserAuth user={user} />
    </Header>
  )
}
