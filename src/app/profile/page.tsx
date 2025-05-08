import type { groups } from '@prisma/client'

import { api } from '@/trpc/server'
import { AuthLeetcoder } from '@/server/routers/auth'

import { UserForm } from './_components/user-form'

const Page = async () => {
  const user = (await api.auth.getUser()) as AuthLeetcoder
  if (!user.leetcoder?.id) return <div>Why?</div>

  const groups = (await api.groups.getAllGroups()) as groups[]

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-10">
      <div className="z-10 mx-auto w-full max-w-md space-y-8">
        <UserForm
          leetcoder={user.leetcoder}
          groups={groups}
        />
      </div>
    </div>
  )
}

export default Page
