import { BookIcon, Users } from 'lucide-react'
import { FiExternalLink } from 'react-icons/fi'
import Link from 'next/link'

import { cn } from '@/utils/cn'
import type { GroupCardProps } from '@/types/groupsPage.type'
import type { Topic } from '@/types/problems.type'
import { MAX_LEETCODERS } from '@/data/constants'

import { Card, CardHeader, CardContent, CardFooter } from '@/ui/card'
import { ProgressBar } from '../roadmap/_components/progress-bar'
import { Badge } from '@/ui/badge'
import { AvatarGroup } from './avatar-group'
import { RequestModal } from '@/app/group/_components/request-modal'

export const GroupCard = ({ group, problemsCount }: GroupCardProps) => {
  const avatars = group.leetcoders.map((member) => ({
    src: member.avatar,
    alt: member.name,
  }))

  const leetcodersCount = group.leetcoders.length
  const currentProblem = group.group_progress[0]?.roadmap.topic as Topic
  const latestGroupProgress = group.group_progress.reduce((latest, current) => {
    return new Date(current.created_at) > new Date(latest.created_at) ? current : latest
  }, group.group_progress[0])

  const currentProblemNumber = latestGroupProgress?.current_problem ?? 0
  const progress = currentProblemNumber ? currentProblemNumber / problemsCount : 0
  const isFull = leetcodersCount >= MAX_LEETCODERS

  return (
    <Card className="relative z-50 overflow-hidden border border-zinc-700/10 bg-gradient-to-tr from-[#141416] to-[#1C1C1C] shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-tr before:from-zinc-900/20 before:to-zinc-800/5 before:opacity-20 after:absolute after:inset-0 after:-z-20 after:[background-size:200px] after:opacity-[0.15] after:mix-blend-overlay">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700/40 to-zinc-800/40 text-zinc-400 ring-1 ring-zinc-600/30">
              <Users size={18} />
            </div>
            <Link
              href={`/group/${group.group_no}`}
              className="flex items-center gap-2"
            >
              <h3 className="text-xl font-semibold text-white">Group {group.group_no}</h3>
              <FiExternalLink
                size={16}
                className="text-zinc-600"
              />
            </Link>
          </div>
          <Badge variant={isFull ? 'secondary' : 'default'}>
            <Users size={12} />
            {leetcodersCount}/{MAX_LEETCODERS} Leetcoders
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-sm text-zinc-300">Current Topic</div>
            <Badge
              variant="default"
              className={cn(
                'inline-flex items-center gap-1.5',
                currentProblem
                  ? 'bg-blue-600/20 font-medium text-blue-200 ring-1 ring-blue-600/30'
                  : 'bg-zinc-600/20 text-zinc-400 ring-1 ring-zinc-600/30'
              )}
            >
              <BookIcon size={14} />
              {currentProblem || 'Not started'}
            </Badge>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Progress</span>
              <span className="font-medium text-zinc-300">{Math.round(progress * 100)}%</span>
            </div>
            {group.group_progress[0] && problemsCount > 0 ? (
              <div className="space-y-2">
                <div className="rounded-full bg-zinc-800/80 p-1 ring-1 ring-zinc-700/30">
                  <ProgressBar progress={Math.round(progress * 100)} />
                </div>
                <div className="flex justify-end text-xs text-zinc-500">
                  Problem {currentProblemNumber} of {problemsCount}
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

        {!isFull && <RequestModal groupId={String(group.group_no)} />}
      </CardFooter>
    </Card>
  )
}
