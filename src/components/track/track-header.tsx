import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { User } from '@supabase/auth-js'
import { groups } from '@prisma/client'

import { Logo } from '@/components/components/logo'
import { UserMenu } from '@/components/components/user-menu'
import { Button } from '@/components/ui/button'
import { RequestToJoin } from '@/components/track/request-to-join'
import { NavMenu } from '@/components/components/nav-menu'

const TrackHeader = ({
  user,
  groupId,
  isApproved,
  isFull,
  groups,
}: {
  user: User
  groupId: number
  isApproved: boolean
  isFull: boolean
  groups: groups[]
}) => {
  return (
    <header className="mx-auto flex w-full max-w-screen-lg items-center justify-between px-3 pt-5">
      {/* Logo Section */}
      <div className="flex h-full items-center gap-5">
        <Logo className="size-7" />
        <p className="text-lg font-semibold">Group #{groupId}</p>
      </div>

      <NavMenu groups={groups} />

      {/* User Menu or Login Button */}
      <div className="flex flex-row-reverse items-center gap-5">
        {user ? (
          <>
            <UserMenu user={user} />
            {/*{!isApproved && (*/}
            {isFull ||
              (!isApproved && (
                <RequestToJoin
                  user={user}
                  groupId={groupId}
                />
              ))}
          </>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center"
            prefetch
          >
            <Button
              size="sm"
              className="aspect-square h-8 w-8"
              variant="ghost"
            >
              <LogIn size={10} />
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}

export { TrackHeader }
