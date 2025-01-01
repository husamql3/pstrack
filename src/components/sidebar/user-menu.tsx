import { UserRound } from 'lucide-react'

import { getUser } from '@/hooks/get-user'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import LogoutButton from '@/components/sidebar/logout-button'

const UserMenu = async () => {
  const user = await getUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarFallback>
            <UserRound
              size={16}
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
          <span className="text-foreground text-xs font-normal">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
