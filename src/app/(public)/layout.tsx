import { Suspense } from 'react'

import { api } from '@/trpc/server'
import { VERSION } from '@/data/constants'

import { Logo } from '@/app/_components/logo'
import { UserAuth } from '@/app/_components/user-auth'
import { Header } from '@/app/_components/header'
import { NavMenu } from '@/app/_components/nav-menu'
import { Footer } from '@/app/_components/footer'
import { StarsBackground } from '@/ui/stars-background'
import { LinksMenu } from '@/app/_components/links-menu'

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const user = await api.auth.getUser()

  return (
    <div className="relative flex h-screen flex-col">
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <StarsBackground className="fixed inset-0 -z-10" />
      </Suspense>

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
