'use client'

import { useTransition } from 'react'

import { logout } from '@/supabase/auth.service'
import { toast } from '@/hooks/use-toast'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

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
            variant: 'destructive',
            duration: 5000,
          })
        }
      } catch (error) {
        console.error('Error logging out:', error)
        toast({
          title: 'Error',
          description: 'An error occurred while logging out.',
          variant: 'destructive',
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
