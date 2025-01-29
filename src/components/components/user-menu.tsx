import { UserPen, UserRound } from 'lucide-react'

import { type User } from '@supabase/auth-js'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutButton } from '@/components/track/logout-button'

const UserMenu = ({ user }: { user: User }) => {
  const {
    id,
    user_metadata: { email, avatar_url, name },
  } = user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className="h-8 w-8"
      >
        <Avatar className="cursor-pointer">
          <AvatarImage
            src={avatar_url}
            alt={name}
          />
          <AvatarFallback>
            <UserRound
              size={15}
              strokeWidth={2}
              className="text-zinc-50"
              aria-hidden="true"
            />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-w-64">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-semibold">Signed in as</span>
          <span className="text-foreground text-xs font-normal">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
        // onClick={() => {
        //   'use client'
        //   window.location.href = `/u/${id}`
        // }}
        >
          <UserPen
            size={16}
            strokeWidth={2}
            className="opacity-60"
            aria-hidden="true"
          />
          <span>Option 5</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
