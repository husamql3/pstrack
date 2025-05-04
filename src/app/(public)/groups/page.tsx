import { api } from '@/trpc/server'
// import { redis } from '@/config/redis'

import type { GetAllGroupsInfo } from '@/types/groupsPage.type'
import { GroupCard } from './group-card'

const Page = async () => {
  // const roadmapCacheKey = 'roadmap:problemCount'
  const problemsCount = await api.roadmap.count()
  // console.log(problemsCount)
  // let problemsCount: number
  // const roadmapCachedData = (await redis.get(roadmapCacheKey)) as number | null
  // if (roadmapCachedData) {
  //   console.log('##### Using cached roadmap data')
  //   problemsCount = roadmapCachedData
  // } else {
  //   console.log('Roadmap cache miss, fetching from API')
  //   problemsCount = await api.roadmap.count()
  //   if (problemsCount) {
  //     console.log('Caching roadmap data for one week')
  //     await redis.set(roadmapCacheKey, problemsCount, { ex: 604800 }) // cache for one week
  //   }
  // }

  const groupsInfo: GetAllGroupsInfo[] = await api.groups.getAllGroupsInfo()
  // console.log('groupsInfo', groupsInfo)

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
