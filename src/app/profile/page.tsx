import { User } from '@supabase/supabase-js'

import { api } from '@/trpc/server'
import type { leetcoders, groups } from '@prisma/client'

import { UserForm } from './_components/user-form'

const Page = async () => {
  const user = (await api.auth.getUser()) as User
  const leetcoder = (await api.leetcoders.getLeetcoderById({ id: user.id })) as leetcoders
  const groups = (await api.groups.getAllGroups()) as groups[]

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
