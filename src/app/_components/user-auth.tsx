'use client'

import { useAuth } from '@/hooks/useAuth'

import { UserMenu } from '@/components/auth/user-menu'
import Link from 'next/link'

export const UserAuth = () => {
  const { user } = useAuth()

  return <div>{user ? <UserMenu user={user} /> : <Link href="/login">Sign In</Link>}</div>
}
