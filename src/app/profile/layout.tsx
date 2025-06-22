import { api } from '@/trpc/server'
import { VERSION } from '@/data/constants'

import { Logo } from '@/app/_components/logo'
import { UserAuth } from '@/app/_components/user-auth'
import { Header } from '@/app/_components/header'
import { NavMenu } from '@/app/_components/nav-menu'
import { StarsBackgroundWrapper } from '../_components/stars-background-wrapper'

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await api.auth.getUser()

  return (
    <div className="relative flex h-screen flex-col">
      <StarsBackgroundWrapper />

      <Header>
        <div className="flex items-end">
          <Logo />
          <span className="ml-1 hidden rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white/80 opacity-50 sm:block">
            v{VERSION}
          </span>
        </div>
        <NavMenu />
        <UserAuth user={user} />
      </Header>

      {children}
    </div>
  )
}

export default Layout
