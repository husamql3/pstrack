import Link from 'next/link'

import { api } from '@/trpc/server'

import { UserMenu } from '@/app/(auth)/_components/user-menu'

export const UserAuth = async () => {
  const user = await api.auth.getUser()
  return <div>{user ? <UserMenu user={user} /> : <Link href="/login">Sign In</Link>}</div>
}
