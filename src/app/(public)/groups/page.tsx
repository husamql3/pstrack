import { BookIcon, Users } from 'lucide-react'

import { api } from '@/trpc/server'
import { redis } from '@/config/redis'
import { Badge } from '@/ui/badge'
import { cn } from '@/utils/cn'
import { getTopicColor } from '@/utils/problemsUtils'
import type { Topic } from '@/types/problems.type'

import { Card, CardContent, CardFooter, CardHeader } from '@/ui/card'
import { RequestModal } from '@/app/group/_components/request-modal'
import { AvatarGroup } from '@/app/(public)/groups/avatar-group'
import { ProgressBar } from '@/app/(public)/roadmap/_components/progress-bar'

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
      problem_order: number
      topic: string
    }
  }[]
}

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
        {groupsInfo.map((group) => {
          const avatars = group.leetcoders.map((member) => ({
            src: member.avatar,
            alt: member.name,
          }))
          const leetcodersCount = group.leetcoders.length
          const currentProblem = group.group_progress[0]?.roadmap.topic as Topic
          const progress = group.group_progress[0]?.current_problem
            ? group.group_progress[0].current_problem / problemsCount
            : 0

          return (
            <Card
              key={group.id}
              className="relative z-[100] overflow-hidden border border-zinc-700/10 bg-gradient-to-tr from-[#141416] to-[#1C1C1C] shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-tr before:from-zinc-900/20 before:to-zinc-800/5 before:opacity-20 after:absolute after:inset-0 after:-z-20 after:bg-[url('/noise.png')] after:opacity-[0.15] after:mix-blend-overlay after:[background-size:200px]"
            >
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700/40 to-zinc-800/40 text-zinc-400 ring-1 ring-zinc-600/30">
                      <Users size={18} />
                    </div>
                    <h3 className="text-xl font-semibold text-white">Group {group.group_no}</h3>
                  </div>
                  <Badge>
                    <Users size={12} />
                    {leetcodersCount} Leetcoders
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 text-sm text-zinc-500">Current Topic</div>
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium',
                        getTopicColor(currentProblem || '')
                      )}
                    >
                      <BookIcon size={14} />
                      {currentProblem || 'Not started'}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Progress</span>
                      <span className="font-medium text-zinc-300">
                        {Math.round(progress * 100)}%
                      </span>
                    </div>
                    {group.group_progress[0] && problemsCount > 0 ? (
                      <div className="space-y-2">
                        <div className="rounded-full bg-zinc-800/80 p-1 ring-1 ring-zinc-700/30">
                          <ProgressBar progress={Math.round(progress * 100)} />
                        </div>
                        <div className="flex justify-end text-xs text-zinc-500">
                          Problem {group.group_progress[0].current_problem} of {problemsCount}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-600 italic">Not started</div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
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
