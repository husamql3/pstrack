import { UserMenu } from '@/app/(auth)/_components/user-menu'
import { StaticLink } from '@/ui/hover-link'
import { AuthLeetcoder } from '@/server/routers/auth'

export const UserAuth = async ({ user }: { user: AuthLeetcoder | null }) => {
  return (
    <div className="flex items-center">
      {user ? (
        <UserMenu user={user} />
      ) : (
        <StaticLink
          href="/login"
          className="px-5"
        >
          <span>Login</span>
        </StaticLink>
      )}
    </div>
  )
}
