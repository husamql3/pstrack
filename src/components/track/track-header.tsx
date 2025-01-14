import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { User } from '@supabase/auth-js'

import { Logo } from '@/components/components/logo'
import { UserMenu } from '@/components/track/user-menu'
import { Button } from '@/components/ui/button'
import { RequestToJoin } from '@/components/track/request-to-join'

const TrackHeader = ({ user, groupId }: { user: User; groupId: number }) => {
  return (
    <header className="mx-auto flex h-16 max-w-screen-lg items-center justify-between px-3">
      {/* Logo Section */}
      <div className="flex h-full items-center gap-5">
        <Logo className="size-7" />
        <p className="text-lg font-semibold">Group #{groupId}</p>
      </div>

      {/* User Menu or Login Button */}
      <div className="flex h-full flex-row-reverse items-center gap-5">
        {user ? (
          <>
            <UserMenu user={user} />
            <RequestToJoin
              user={user}
              groupId={groupId}
            />
          </>
        ) : (
          <Link
            href="/login"
            className="flex h-full items-center justify-center border-l px-3"
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
