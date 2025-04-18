import { Logo } from '@/app/_components/logo'
import { UserAuth } from '@/app/_components/user-auth'
import { Header } from '@/app/_components/header'
import { NavMenu } from '@/app/_components/nav-menu'
import { Footer } from '@/app/_components/footer'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex h-screen flex-col">
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
