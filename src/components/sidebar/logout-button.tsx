'use client'

import { useTransition } from 'react'
import { logout } from '@/db/supabase/services/auth.service'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

const LogoutButton = () => {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <DropdownMenuItem
      onClick={handleLogout}
      disabled={isPending}
    >
      Logout
    </DropdownMenuItem>
  )
}

export default LogoutButton
