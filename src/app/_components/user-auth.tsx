import type { User } from '@supabase/supabase-js'
import { LucideLogIn } from 'lucide-react'

import { UserMenu } from '@/app/(auth)/_components/user-menu'
import { StaticLink } from '@/ui/hover-link'

export const UserAuth = async ({ user }: { user: User | null }) => {
  return (
    <div className="flex items-center">
      {user ? (
        <UserMenu user={user} />
      ) : (
        <StaticLink
          href="/login"
          className="px-5"
        >
          <span className="hidden sm:block">Login</span>
          <LucideLogIn className="block size-5 sm:hidden" />
        </StaticLink>
      )}
    </div>
  )
}
