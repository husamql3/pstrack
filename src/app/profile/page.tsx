import type { groups, leetcoders } from '@prisma/client'

import { api } from '@/trpc/server'
import { AuthLeetcoder } from '@/server/routers/auth'

import { UserForm } from './_components/user-form'

const Page = async () => {
  const [user, allGroups] = await Promise.all([
    api.auth.getUser() as Promise<AuthLeetcoder>,
    api.groups.getAllGroups() as Promise<groups[]>,
  ])

  const leetcoder = user.leetcoder as leetcoders
  const groups = allGroups

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-10">
      <div className="z-10 mx-auto w-full max-w-md space-y-8">
        <UserForm
          leetcoder={leetcoder}
          groups={groups}
        />
      </div>
    </div>
  )
}

export default Page
