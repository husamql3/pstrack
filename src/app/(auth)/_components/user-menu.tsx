'use client'

import { FaUserGroup } from 'react-icons/fa6'
import { IoExitOutline } from 'react-icons/io5'
import { FaUserShield } from 'react-icons/fa'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { signOut } from '@/supabase/auth.service'
import { api } from '@/trpc/react'
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

const MenuItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => Promise<void> }) => (
  <DropdownMenuItem onClick={onClick}>
    {icon}
    <span className="ml-2">{label}</span>
  </DropdownMenuItem>
)

const renderAvatar = (user: User) => (
  <Avatar>
    <AvatarImage
      src={user?.user_metadata?.avatar_url || ''}
      alt={user?.user_metadata?.full_name || ''}
    />
    <AvatarFallback>{user?.user_metadata?.full_name?.substring(0, 2)}</AvatarFallback>
  </Avatar>
)

export const UserMenu = ({ user }: { user: User }) => {
  const router = useRouter()
  const { data: leetcoder } = api.leetcoders.getLeetcoderById.useQuery({ id: user.id })
  const isAdmin = leetcoder?.email === AUTHOR_EMAIL

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

  const navigateToGroup = async () => {
    if (leetcoder?.group_no) {
      router.push(`/group/${leetcoder.group_no}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto cursor-pointer rounded-full p-0 hover:bg-transparent"
        >
          {renderAvatar(user)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="text-muted-foreground truncate text-xs font-normal">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

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
