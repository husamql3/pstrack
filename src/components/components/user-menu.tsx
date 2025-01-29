import { UserRound } from 'lucide-react'

import { type User } from '@supabase/auth-js'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoutButton, UserButton } from '@/components/components/user-menu-buttons'

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
        <UserButton userId={id} />
        <DropdownMenuSeparator />
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
