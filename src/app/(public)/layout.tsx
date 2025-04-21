import { Suspense } from 'react'

import { Logo } from '@/app/_components/logo'
import { UserAuth } from '@/app/_components/user-auth'
import { Header } from '@/app/_components/header'
import { NavMenu } from '@/app/_components/nav-menu'
import { Footer } from '@/app/_components/footer'
import { StarsBackground } from '@/ui/stars-background'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex h-screen flex-col">
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <StarsBackground className="fixed inset-0 -z-10" />
      </Suspense>

      <Header>
        <Logo />
        <NavMenu />
        <UserAuth />
      </Header>

      {children}
      <Footer />
    </div>
  )
}

export default Layout
