import Link from 'next/link'

import { api } from '@/trpc/server'

import { UserMenu } from '@/app/(auth)/_components/user-menu'

export const UserAuth = async () => {
  const user = await api.auth.getUser()
  // todo: add sekeleton
  return (
    <div className="flex items-center">
      {user ? <UserMenu user={user} /> : <Link href="/login">Sign In</Link>}
    </div>
  )
}
