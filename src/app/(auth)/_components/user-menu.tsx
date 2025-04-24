'use client'

import { IoPersonOutline } from 'react-icons/io5'
import type { User } from '@supabase/supabase-js'

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
import { LogoutBtn } from '@/app/(auth)/_components/logout-btn'

export const UserMenu = ({ user }: { user: User }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto rounded-full p-0 hover:bg-transparent"
        >
          <Avatar>
            <AvatarImage
              src={user?.user_metadata?.avatar_url || ''}
              alt={user?.user_metadata?.full_name || ''}
            />
            <AvatarFallback>{user?.user_metadata?.full_name?.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64">
        <DropdownMenuLabel className="flex min-w-0 flex-col">
          <span className="text-muted-foreground truncate text-xs font-normal">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <IoPersonOutline
              size={16}
              className="opacity-60"
              aria-hidden="true"
            />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <LogoutBtn />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
