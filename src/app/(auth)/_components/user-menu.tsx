'use client'

// import { IoPersonOutline } from 'react-icons/io5'
import { FaUserGroup } from 'react-icons/fa6'
import { IoExitOutline } from 'react-icons/io5'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { signOut } from '@/supabase/auth.service'
import { api } from '@/trpc/react'

import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  // DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

export const UserMenu = ({ user }: { user: User }) => {
  const router = useRouter()
  const { data: leetcoder } = api.leetcoders.getLeetcoderById.useQuery({ id: user.id })

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
        <DropdownMenuItem
          onClick={async () => {
            if (leetcoder?.group_no) {
              router.push(`/group/${leetcoder.group_no}`)
            }
          }}
        >
          <FaUserGroup
            size={16}
            className="opacity-60"
          />
          <span className="ml-2">My Group</span>
        </DropdownMenuItem>
        <DropdownMenuGroup>
          {/* <DropdownMenuItem>
            <IoPersonOutline
              size={16}
              className="opacity-60"
              aria-hidden="true"
            />
            <span>Profile</span>
          </DropdownMenuItem> */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            const { error } = await signOut()
            if (error) {
              toast.error(error.message)
              return
            }

            router.push('/login')
          }}
        >
          <IoExitOutline
            size={16}
            className="opacity-60"
          />
          <span className="ml-2">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
