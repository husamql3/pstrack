import { UserMenu } from '@/components/auth/user-menu'
import Image from 'next/image'
import { UserAuth } from './user-auth'

export const Header = () => {
  return (
    <header className="mx-auto w-full max-w-3xl pt-8 pb-5">
      <div className="flex items-center justify-between">
        <Image
          src="/logo.png"
          alt="Logo"
          width={35}
          height={35}
        />

        <UserAuth />
      </div>
    </header>
  )
}
