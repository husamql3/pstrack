'use client'

import { useRouter } from 'next/navigation'
import { LogOut, UserPen } from 'lucide-react'

import { logout } from '@/supabase/auth.service'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

const LogoutButton = () => {
  return (
    <DropdownMenuItem onClick={async () => await logout()}>
      <LogOut
        size={16}
        strokeWidth={2}
        className="opacity-60"
        aria-hidden="true"
      />
      <span>Logout</span>
    </DropdownMenuItem>
  )
}

const UserButton = ({ userId }: { userId: string }) => {
  const router = useRouter()
  return (
    <DropdownMenuItem onClick={() => router.push('/u/' + userId)}>
      <UserPen
        size={16}
        strokeWidth={2}
        className="opacity-60"
        aria-hidden="true"
      />
      <span>Profile</span>
    </DropdownMenuItem>
  )
}

export { LogoutButton, UserButton }
