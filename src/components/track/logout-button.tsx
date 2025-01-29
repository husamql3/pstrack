'use client'

import { logout } from '@/supabase/auth.service'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

const LogoutButton = () => {
  return <DropdownMenuItem onClick={async () => await logout()}>Logout</DropdownMenuItem>
}

export { LogoutButton }
