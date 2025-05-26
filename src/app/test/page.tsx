import { db } from '@/prisma/db'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { GiLaurelCrown, GiQueenCrown } from 'react-icons/gi'
import { cache } from 'react'
import { cn } from '@/utils/cn'

const getTopUsers = cache(async (groupNo: number) => {
  // First, let's get users with their submission counts using a raw approach
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

  // Sort by submission count manually and take top 3
  const sortedUsers = usersWithCounts
    .filter((user) => user.submissions.length > 0) // Only users with submissions
    .sort((a, b) => {
      // Primary sort: by submission count (descending)
      const countDiff = b.submissions.length - a.submissions.length
      if (countDiff !== 0) return countDiff

      // Secondary sort: by earliest submission date (who submitted first wins)
      const aEarliestSubmission = a.submissions.reduce((earliest, submission) => {
        return new Date(submission.created_at) < new Date(earliest.created_at) ? submission : earliest
      })
      const bEarliestSubmission = b.submissions.reduce((earliest, submission) => {
        return new Date(submission.created_at) < new Date(earliest.created_at) ? submission : earliest
      })

      return new Date(aEarliestSubmission.created_at).getTime() - new Date(bEarliestSubmission.created_at).getTime()
    })
    .slice(0, 3)

  // Debug log to see what we're getting
  console.log(
    'Users with submission counts:',
    usersWithCounts.map((u) => ({
      username: u.username,
      submissionCount: u.submissions.length,
    }))
  )

  return sortedUsers
})
const BadgeBackgroundShine = ({ text, position }: { text: string; position: number }) => {
  const getBadgeColors = () => {
    switch (position) {
      case 1:
        return 'bg-[linear-gradient(110deg,#FFD700,45%,#FFF8B8,55%,#FFD700)] text-black'
      case 2:
        return 'bg-[linear-gradient(110deg,#C0C0C0,45%,#E8E8E8,55%,#C0C0C0)] text-black'
      case 3:
        return 'bg-[linear-gradient(110deg,#CD7F32,45%,#E8B27D,55%,#CD7F32)] text-black'
      default:
        return 'bg-[linear-gradient(110deg,#000103,45%,#303030,55%,#000103)] text-neutral-200 dark:text-neutral-400'
    }
  }

  return (
    <div
      className={cn(
        'animate-shine items-center justify-center rounded-full border font-medium transition-colors',
        'flex aspect-square h-6 w-6 items-center justify-center bg-[length:400%_100%] text-xs',
        getBadgeColors(),
        position === 1
          ? 'border-yellow-400'
          : position === 2
            ? 'border-gray-300'
            : position === 3
              ? 'border-amber-700'
              : 'border-white/10'
      )}
    >
      {text}
    </div>
  )
}

const Page = async () => {
  const groupNo = 1
  const topUsers = await getTopUsers(groupNo)

  return (
    <div className="mx-auto flex h-screen max-w-sm flex-col items-center justify-center p-4 text-white">
      <div className="mx-auto flex w-full items-end gap-5">
        {/* second place */}
        {topUsers[1] && (
          <div className="relative flex flex-col items-center">
            <div className="relative">
              <Avatar className="size-24 border-2 border-gray-300">
                <AvatarImage
                  src={topUsers[1].avatar || ''}
                  alt={topUsers[1].username}
                />
              </Avatar>
              <div className="absolute top-0 right-0">
                <BadgeBackgroundShine
                  text="2"
                  position={2}
                />
              </div>
            </div>
            {/* Changed text color to match position 2 badge border */}
            <p className="font-semibold text-gray-300">@{topUsers[1].username}</p>
          </div>
        )}

        {/* first place */}
        {topUsers[0] && (
          <div className="relative mb-3 flex flex-col items-center">
            <div className="relative">
              <Avatar className="size-28 border-2 border-yellow-400">
                <AvatarImage
                  src={topUsers[0].avatar || ''}
                  alt={topUsers[0].username}
                />
              </Avatar>
              <div className="absolute top-0 right-0">
                <BadgeBackgroundShine
                  text="1"
                  position={1}
                />
              </div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <GiLaurelCrown className="text-3xl text-yellow-400" />
              </div>
            </div>
            <p className="font-semibold text-yellow-400">@{topUsers[0].username}</p>
          </div>
        )}

        {/* third place */}
        {topUsers[2] && (
          <div className="relative flex flex-col items-center">
            <div className="relative">
              <Avatar className="size-20 border-2 border-amber-700">
                <AvatarImage
                  src={topUsers[2].avatar || ''}
                  alt={topUsers[2].username}
                />
              </Avatar>
              <div className="absolute right-0 bottom-0">
                <BadgeBackgroundShine
                  text="3"
                  position={3}
                />
              </div>
            </div>
            {/* Changed text color to match position 3 badge border */}
            <p className="font-semibold text-amber-700">@{topUsers[2].username}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Page
