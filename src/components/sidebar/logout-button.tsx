'use client'

import { useTransition } from 'react'
import { logout } from '@/db/supabase/services/auth.service'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'

const LogoutButton = () => {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      try {
        const response = await logout()
        if (response.success) {
          window.location.reload()
        } else {
          toast({
            title: 'Error',
            description: response.message,
            duration: 5000,
          })
        }
      } catch (error) {
        console.error('Error logging out:', error)
        toast({
          title: 'Error',
          description: 'An error occurred while logging out.',
          duration: 5000,
        })
      }
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

export { LogoutButton }
