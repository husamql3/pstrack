import { db } from '@/prisma/db'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { cn } from '@/utils/cn'
import type { leetcoders } from '@prisma/client'
import { Star, Award, Shield } from 'lucide-react'
import { cache } from 'react'

interface UserWithSubmissions extends leetcoders {
  submissions: Array<{
    solved: boolean
    created_at: Date
  }>
}

const getTopUsers = cache(async (groupNo: number): Promise<UserWithSubmissions[]> => {
  const usersWithCounts = await db.leetcoders.findMany({
    where: {
      status: 'APPROVED',
      group_no: groupNo,
    },
    include: {
      submissions: {
        where: {
          solved: true,
        },
      },
    },
  })

  const sortedUsers = usersWithCounts
    .filter((user) => user.submissions.length > 0)
    .sort((a, b) => {
      const countDiff = b.submissions.length - a.submissions.length
      if (countDiff !== 0) return countDiff

      const aEarliestSubmission = a.submissions.reduce((earliest, submission) => {
        return new Date(submission.created_at) < new Date(earliest.created_at) ? submission : earliest
      })
      const bEarliestSubmission = b.submissions.reduce((earliest, submission) => {
        return new Date(submission.created_at) < new Date(earliest.created_at) ? submission : earliest
      })

      return new Date(aEarliestSubmission.created_at).getTime() - new Date(bEarliestSubmission.created_at).getTime()
    })
    .slice(0, 3)

  return sortedUsers
})

interface PodiumStepProps {
  user: UserWithSubmissions
  position: number
  height: string
}

const PodiumStep = ({ user, position, height }: PodiumStepProps) => {
  const getPositionConfig = () => {
    switch (position) {
      case 1:
        return {
          icon: Star,
          iconColor: 'text-yellow-400',
          borderColor: 'border-yellow-400/50',
          bgGradient: 'from-yellow-400/20 via-yellow-300/10 to-transparent',
          textColor: 'text-yellow-400',
          badgeColor: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900',
          ringColor: 'ring-yellow-400/30',
          stepColor: 'bg-gradient-to-t from-yellow-400/30 to-yellow-300/20',
          badgeAnimation: 'bg-[linear-gradient(110deg,#000103,45%,#eab308,55%,#000103)]',
        }
      case 2:
        return {
          icon: Award,
          iconColor: 'text-slate-400',
          borderColor: 'border-slate-400/50',
          bgGradient: 'from-slate-400/20 via-slate-300/10 to-transparent',
          textColor: 'text-slate-400',
          badgeColor: 'bg-gradient-to-r from-slate-400 to-slate-500 text-slate-900',
          ringColor: 'ring-slate-400/30',
          stepColor: 'bg-gradient-to-t from-slate-400/30 to-slate-300/20',
          badgeAnimation: 'bg-[linear-gradient(110deg,#000103,45%,#94a3b8,55%,#000103)]',
        }
      case 3:
        return {
          icon: Shield,
          iconColor: 'text-amber-600',
          borderColor: 'border-amber-600/50',
          bgGradient: 'from-amber-600/20 via-amber-500/10 to-transparent',
          textColor: 'text-amber-600',
          badgeColor: 'bg-gradient-to-r from-amber-600 to-amber-700 text-amber-100',
          ringColor: 'ring-amber-600/30',
          stepColor: 'bg-gradient-to-t from-amber-600/30 to-amber-500/20',
          badgeAnimation: 'bg-[linear-gradient(110deg,#000103,45%,#d97706,55%,#000103)]',
        }
      default:
        throw new Error('Invalid position')
    }
  }

  const config = getPositionConfig()
  const IconComponent = config.icon

  return (
    <div className="relative flex flex-col items-center">
      {/* User Card */}
      <div
        className={cn(
          'relative -mt-6 flex flex-col items-center rounded-xl border px-3 pt-4 pb-2 backdrop-blur-sm',
          'bg-gradient-to-br',
          config.bgGradient,
          config.borderColor,
          'shadow-lg'
        )}
      >
        {/* Avatar */}
        <div className={cn('relative rounded-full ring-2', config.ringColor)}>
          <Avatar className="h-12 w-12 border-2 border-white/50">
            <AvatarImage
              src={user.avatar || ''}
              alt={user.username}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-semibold text-gray-600">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Submission count badge with icon */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
            <div
              className={cn(
                'animate-shine flex h-5 min-w-5 items-center justify-center rounded-full border border-white/10 font-medium text-neutral-200 transition-colors',
                config.badgeAnimation,
                'gap-1 bg-[length:400%_100%] text-xs dark:text-neutral-400'
              )}
            >
              <IconComponent className={cn('size-3', config.iconColor)} />
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="mt-2 text-center">
          <p className={cn('max-w-16 truncate text-xs font-semibold', config.textColor)}>@{user.username}</p>
        </div>
      </div>
    </div>
  )
}

interface MinimalLeaderboardProps {
  groupNo?: number
}

const MinimalLeaderboard = async ({ groupNo = 1 }: MinimalLeaderboardProps) => {
  const topUsers = await getTopUsers(groupNo)

  if (topUsers.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Award className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-500">No submissions yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-sm flex-col items-center justify-center">
      {/* Podium */}
      <div className="flex items-end justify-center gap-4">
        {/* Second Place */}
        {topUsers[1] && (
          <PodiumStep
            user={topUsers[1]}
            position={2}
            height="h-16"
          />
        )}

        {/* First Place */}
        {topUsers[0] && (
          <PodiumStep
            user={topUsers[0]}
            position={1}
            height="h-20"
          />
        )}

        {/* Third Place */}
        {topUsers[2] && (
          <PodiumStep
            user={topUsers[2]}
            position={3}
            height="h-12"
          />
        )}
      </div>
    </div>
  )
}

export default MinimalLeaderboard
