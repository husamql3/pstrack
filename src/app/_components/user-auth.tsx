import { api } from '@/trpc/server'

import { UserMenu } from '@/app/(auth)/_components/user-menu'
import { StaticLink } from '@/components/ui/hover-link'

export const UserAuth = async () => {
  const user = await api.auth.getUser()
  return (
    <div className="flex items-center">
      {user ? <UserMenu user={user} /> : <StaticLink href="/login">Login</StaticLink>}
    </div>
  )
}
