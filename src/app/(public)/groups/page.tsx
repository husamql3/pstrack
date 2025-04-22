import { api } from '@/trpc/server'
import { redis } from '@/config/redis'

import { Badge } from '@/ui/badge'
import { cn } from '@/utils/cn'
import { getTopicColor } from '@/utils/problemsUtils'
import type { Topic } from '@/types/problems.type'

import type { RoadmapType } from '@/app/(public)/roadmap/_components/roadmap'
import { Card, CardContent, CardFooter, CardHeader } from '@/ui/card'
import { RequestModal } from '@/app/group/_components/request-modal'
import { AvatarGroup } from '@/app/(public)/groups/avatar-group'
import { ProgressBar } from '../roadmap/_components/progress-bar'

export type GetAllGroupsInfo = {
  id: string
  group_no: number
  leetcoders: {
    id: string
    name: string
    avatar: string | null
  }[]
  group_progress: {
    id: string
    created_at: Date
    group_no: number
    current_problem: number
    roadmap: {
      topic: string
      problem_order: number
    }
  }[]
}

const Page = async () => {
  const roadmapCacheKey = 'roadmap:data'
  let roadmapData: RoadmapType[] = []
  const roadmapCachedData = (await redis.get(roadmapCacheKey)) as RoadmapType[] | null
  if (roadmapCachedData) {
    console.log('##### Using cached roadmap data')
    roadmapData = roadmapCachedData
  } else {
    console.log('Roadmap cache miss, fetching from API')
    roadmapData = await api.roadmap.getRoadmap()
    if (roadmapData) {
      console.log('Caching roadmap data for one week')
      await redis.set(roadmapCacheKey, roadmapData, { ex: 604800 }) // cache for one week
    }
  }

  const groupsCacheKey = 'groups:data'
  let groupsInfo: GetAllGroupsInfo[] = []
  console.log('groupsInfo', JSON.stringify(groupsInfo, null, 2))
  const groupsCacheData = (await redis.get(groupsCacheKey)) as GetAllGroupsInfo[] | null
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

      <div className="flex flex-col gap-3">
        {groupsInfo.map((group) => {
          const avatars = group.leetcoders.map((member) => ({
            src: member.avatar,
            alt: member.name,
          }))
          const leetcodersCount = group.leetcoders.length
          const currentProblem = group.group_progress[0]?.roadmap.topic as Topic
          const progress = group.group_progress[0]?.current_problem / roadmapData.length

          return (
            <Card
              key={group.id}
              className="hover:bg-zinc-750 border-zinc-900 bg-zinc-950 transition-colors duration-200"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">Group {group.group_no}</h3>
                  <Badge
                    variant="default"
                    className="bg-blue-600 text-white"
                  >
                    {leetcodersCount} Leetcoders
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <div className="mb-1 text-sm text-gray-400">Current Problem:</div>
                  <div
                    className={cn(
                      'w-fit rounded-md px-2 py-0.5 text-sm font-medium whitespace-nowrap',
                      getTopicColor(currentProblem)
                    )}
                  >
                    {currentProblem || 'Not started'}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gray-300">{Math.round(progress * 100)}%</span>
                  </div>
                  {group.group_progress[0] ? (
                    <div className="space-y-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                        <ProgressBar progress={progress} />
                      </div>
                      <div className="text-right text-xs text-gray-400">
                        Problem {group.group_progress[0].current_problem} of {roadmapData.length}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Not started</div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between border-gray-700">
                <AvatarGroup
                  avatars={avatars}
                  totalCount={leetcodersCount}
                />

                <RequestModal groupId={String(group.group_no)} />
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Page
