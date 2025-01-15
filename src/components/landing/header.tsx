import Link from 'next/link'
import { LogIn } from 'lucide-react'

import { getUser } from '@/hooks/get-user'

import { Logo } from '@/components/components/logo'
import { Button } from '@/components/ui/button'
import { UserMenu } from '@/components/track/user-menu'

const Header = async () => {
  const user = await getUser()

  return (
    <header className="mx-auto flex w-full max-w-screen-md justify-between px-3 pt-5 md:px-0 md:pt-8">
      <Logo />

      {user ? (
        <UserMenu user={user} />
      ) : (
        <Link
          prefetch
          href="/login"
        >
          <Button
            variant="outline"
            className="h-10 rounded-full border-2 px-5 text-sm font-medium"
          >
            Login
            <LogIn size={7} />
          </Button>
        </Link>
      )}
    </header>
  )
}

export default Header
