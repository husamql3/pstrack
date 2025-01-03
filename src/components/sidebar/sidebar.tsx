import Link from 'next/link'
import { LogIn } from 'lucide-react'

import { getUser } from '@/hooks/get-user'

import Logo from '@/components/components/logo'
import UserMenu from '@/components/sidebar/user-menu'
import { Button } from '@/components/ui/button'

const Sidebar = async () => {
  const user = await getUser()

  return (
    <aside className="flex flex-col items-center justify-between px-3 py-5">
      <Logo />

      {user ? (
        <UserMenu user={user!} />
      ) : (
        <Link
          href="/login"
          prefetch
        >
          <Button className="h-10 w-10 rounded-full">
            <LogIn
              size={18}
              className="h-10 w-10"
            />
          </Button>
        </Link>
      )}
    </aside>
  )
}

export default Sidebar
