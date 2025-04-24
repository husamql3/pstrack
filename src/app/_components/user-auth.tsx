import type { User } from '@supabase/supabase-js'

import { UserMenu } from '@/app/(auth)/_components/user-menu'
import { StaticLink } from '@/ui/hover-link'

export const UserAuth = async ({ user }: { user: User | null }) => {
  return (
    <div className="flex items-center">
      {user ? <UserMenu user={user} /> : <StaticLink href="/login">Login</StaticLink>}
    </div>
  )
}
