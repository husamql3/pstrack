'use client'

import Link from 'next/link'

import { useAuth } from '@/hooks/useAuth'
import { UserMenu } from '../(auth)/_components/user-menu'

export const UserAuth = () => {
  const { user } = useAuth()

  return <div>{user ? <UserMenu user={user} /> : <Link href="/login">Sign In</Link>}</div>
}
