import { api } from '@/trpc/server'
import type { GetAllGroupsInfo } from '@/types/groupsPage.type'
import { redis } from '@/config/redis'

import { GroupCard } from './group-card'

const Page = async () => {
  const problemsCount = await api.roadmap.count()
  const groupsInfo: GetAllGroupsInfo[] = await api.groups.getAllGroupsInfo()
  const user = await api.auth.getUser()
  const userGroup = user?.leetcoder?.group_no

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-10">
      <h1 className="mb-10 text-4xl font-bold">Groups</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groupsInfo.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            problemsCount={problemsCount}
            userGroup={userGroup}
          />
        ))}
      </div>
    </div>
  )
}

export default Page
