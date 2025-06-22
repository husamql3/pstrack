import type { leetcoders } from '@prisma/client'
import { api } from '@/trpc/server'
import type { GetAllAvailableGroupsType } from '@/types/groups.type'

import { JoinBackButton } from './_components/join-back-button'
import { UserForm } from './_components/user-form'

const Page = async () => {
  const user = await api.auth.getUser()
  const allGroups = (await api.groups.getAllAvailableGroups()) as GetAllAvailableGroupsType[]
  const leetcoder = user?.leetcoder as leetcoders

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-10">
      <div className="z-10 mx-auto w-full max-w-md space-y-8">
        <UserForm
          leetcoder={leetcoder}
          groups={allGroups}
        />

        <JoinBackButton
          userStatus={leetcoder.status}
          hasSecondChance={leetcoder.has_second_chance}
        />
      </div>
    </div>
  )
}

export default Page
