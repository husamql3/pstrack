'use client'

import { FaUserGroup } from 'react-icons/fa6'
import { IoExitOutline } from 'react-icons/io5'
import { FaUser, FaUserShield } from 'react-icons/fa'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { signOut } from '@/supabase/auth.service'
import { AUTHOR_EMAIL } from '@/data/constants'

import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { AuthLeetcoder } from '@/server/routers/auth'

const MenuItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => Promise<void> }) => (
  <DropdownMenuItem onClick={onClick}>
    {icon}
    <span className="ml-2">{label}</span>
  </DropdownMenuItem>
)

export const UserMenu = ({ user }: { user: AuthLeetcoder }) => {
  const router = useRouter()

  const isAdmin = user.email === AUTHOR_EMAIL
  const isMember = user.leetcoder?.status === 'APPROVED' || user.leetcoder?.status === 'PENDING'

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    router.push('/login')
  }

  const navigateToDashboard = async () => {
    router.push('/dashboard')
  }

  const navigateToProfile = async () => {
    router.push('/profile')
  }

  const navigateToGroup = async () => {
    if (user.leetcoder?.group_no) {
      router.push(`/group/${user.leetcoder.group_no}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto cursor-pointer rounded-full p-0 hover:bg-transparent"
        >
          <Avatar>
            <AvatarImage
              src={user?.leetcoder?.avatar || ''}
              alt={user?.leetcoder?.name || ''}
            />
            <AvatarFallback>{user?.user_metadata?.full_name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="text-muted-foreground truncate text-xs font-normal">{user?.email}</span>
        </DropdownMenuLabel>

        {isMember && (
          <>
            <DropdownMenuSeparator />

            <MenuItem
              icon={
                <FaUserGroup
                  size={16}
                  className="opacity-60"
                />
              }
              label="My Group"
              onClick={navigateToGroup}
            />

            <MenuItem
              icon={
                <FaUser
                  size={16}
                  className="opacity-60"
                />
              }
              label="Profile"
              onClick={navigateToProfile}
            />
          </>
        )}

        {isAdmin && (
          <MenuItem
            icon={
              <FaUserShield
                size={16}
                className="opacity-60"
              />
            }
            label="Dashboard"
            onClick={navigateToDashboard}
          />
        )}

        <DropdownMenuGroup />
        <DropdownMenuSeparator />

        <MenuItem
          icon={
            <IoExitOutline
              size={16}
              className="opacity-60"
            />
          }
          label="Logout"
          onClick={handleLogout}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
