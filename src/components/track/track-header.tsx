import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { User } from '@supabase/auth-js'

import { Logo } from '@/components/components/logo'
import { UserMenu } from '@/components/sidebar/user-menu'
import { Button } from '@/components/ui/button'
import { RequestToJoin } from '@/components/track/request-to-join'

const TrackHeader = ({ user, groupId }: { user: User; groupId: number }) => {
  return (
    <header className="flex h-12 items-center justify-between border-b border-zinc-900">
      {/* Logo Section */}
      <div className="flex h-full items-center">
        <div className="flex h-full items-center border-r border-zinc-900 px-2">
          <Logo className="size-7" />
        </div>

        <div className="flex h-full items-center border-r border-zinc-900 px-3">
          <p className="text-lg font-semibold">Group {groupId}</p>
        </div>
      </div>

      {/* User Menu or Login Button */}
      <div className="flex h-full flex-row-reverse items-center">
        {user ? (
          <>
            <div className="flex h-full items-center border-l border-zinc-900 px-3">
              <UserMenu user={user} />
            </div>
            <div className="flex h-full items-center border-l border-zinc-900 px-3">
              <RequestToJoin
                user={user}
                groupId={groupId}
              />
            </div>
          </>
        ) : (
          <Link
            href="/login"
            className="flex h-full items-center justify-center border-l border-zinc-900 px-3"
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
