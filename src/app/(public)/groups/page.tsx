import { api } from '@/trpc/server'
import { redis } from '@/config/redis'

import type { GetAllGroupsInfo } from '@/types/groupsPage.type'
import { GroupCard } from './group-card'

const Page = async () => {
  const roadmapCacheKey = 'roadmap:problemCount'
  let problemsCount: number
  const roadmapCachedData = (await redis.get(roadmapCacheKey)) as number | null
  if (roadmapCachedData) {
    console.log('##### Using cached roadmap data')
    problemsCount = roadmapCachedData
  } else {
    console.log('Roadmap cache miss, fetching from API')
    problemsCount = await api.roadmap.count()
    if (problemsCount) {
      console.log('Caching roadmap data for one week')
      await redis.set(roadmapCacheKey, problemsCount, { ex: 604800 }) // cache for one week
    }
  }

  const groupsCacheKey = 'groups:data'
  let groupsInfo: GetAllGroupsInfo[] = []
  const groupsCacheData = (await redis.get(groupsCacheKey)) as GetAllGroupsInfo[]
  if (groupsCacheData) {
    console.log('##### Using cached groups data')
    groupsInfo = groupsCacheData
  } else {
    console.log('Groups cache miss, fetching from API')
    groupsInfo = await api.groups.getAllGroupsInfo()
    if (groupsInfo) {
      console.log('Caching groups data for one hour')
      await redis.set(groupsCacheKey, groupsInfo, { ex: 3600 }) // cache for one hour
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3 py-10">
      <h1 className="mb-10 text-4xl font-bold">Groups</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groupsInfo.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            problemsCount={problemsCount}
          />
        ))}
      </div>
    </div>
  )
}

export default Page
