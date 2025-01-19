import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { User } from '@supabase/auth-js'

import { Logo } from '@/components/components/logo'
import { UserMenu } from '@/components/track/user-menu'
import { Button } from '@/components/ui/button'
import { RequestToJoin } from '@/components/track/request-to-join'

const TrackHeader = ({
  user,
  groupId,
  isApproved,
}: {
  user: User
  groupId: number
  isApproved: boolean
}) => {
  return (
    <header className="mx-auto flex w-full max-w-screen-lg items-center justify-between px-3 pt-3">
      {/* Logo Section */}
      <div className="flex h-full items-center gap-5">
        <Link
          href="/"
          className="flex items-center gap-2"
          prefetch
        >
          <Logo className="size-7" />
        </Link>

        <p className="text-lg font-semibold">Group #{groupId}</p>
      </div>

      {/* User Menu or Login Button */}
      <div className="flex flex-row-reverse items-center gap-5">
        {user ? (
          <>
            <UserMenu user={user} />
            {!isApproved && (
              <RequestToJoin
                user={user}
                groupId={groupId}
              />
            )}
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
