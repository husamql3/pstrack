import { Logo } from '@/app/_components/logo'
import { UserAuth } from '@/app/_components/user-auth'

export const Header = () => {
  return (
    <header className="mx-auto w-full max-w-3xl pt-8 pb-5">
      <div className="flex items-center justify-between">
        <Logo />
        <UserAuth />
      </div>
    </header>
  )
}
