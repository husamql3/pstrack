'use server'

import { Footer } from '@/app/_components/footer'
import { Header } from '@/app/_components/header'
import { LinksMenu } from '@/app/_components/links-menu'
import { Logo } from '@/app/_components/logo'
import { NavMenu } from '@/app/_components/nav-menu'
import { UserAuth } from '@/app/_components/user-auth'
import { VERSION } from '@/data/constants'
import { api } from '@/trpc/server'
import { StarsBackgroundWrapper } from '../_components/stars-background-wrapper'

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await api.auth.getUser()

  return (
    <div className="relative flex h-screen flex-col">
      <StarsBackgroundWrapper />

      <Header>
        <LinksMenu className="sm:hidden" />

        <div className="hidden w-32 items-end justify-start sm:flex">
          <Logo />
          <span className="ml-1 hidden rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-medium text-white/80 opacity-50 sm:block">
            v{VERSION}
          </span>
        </div>

        <NavMenu className="hidden sm:block" />
        <div className="flex w-32 justify-end">
          <UserAuth user={user} />
        </div>
      </Header>

      {children}
      <Footer />
    </div>
  )
}

export default Layout
