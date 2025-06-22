import type { leetcoders as leetcodersType } from '@prisma/client'
import { Calendar, Globe } from 'lucide-react'
import { useMemo } from 'react'
import { FaLinkedin, FaXTwitter } from 'react-icons/fa6'
import { LuGithub } from 'react-icons/lu'

import { api } from '@/trpc/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/ui/hover-card'
import { cn } from '@/utils/cn'
import { getSocialLink } from '@/utils/leetcoderCard'

export const LeetCoderCard = ({ leetcoder, className }: { leetcoder: leetcodersType; className?: string }) => {
  const { data: user } = api.auth.getUser.useQuery()
  const memoizedLeetcoder = useMemo(() => leetcoder, [leetcoder])
  const currUser = user?.id === memoizedLeetcoder.id

  const isVisible = memoizedLeetcoder.is_visible

  return (
    <HoverCard>
      <div className="flex items-center gap-3">
        <HoverCardTrigger asChild>
          <p
            className={cn(
              'text-sm font-medium hover:underline',
              currUser && 'font-semibold text-emerald-500',
              className
            )}
          >
            @{memoizedLeetcoder.username}
          </p>
        </HoverCardTrigger>
      </div>
      <HoverCardContent className="w-64 space-y-2 p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={leetcoder.avatar ?? ''} />
              <AvatarFallback>{memoizedLeetcoder.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <h4 className="truncate font-semibold">{memoizedLeetcoder.name}</h4>
              <p className="text-muted-foreground truncate text-sm">@{memoizedLeetcoder.lc_username}</p>
            </div>
          </div>

          {/* <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="flex items-center space-x-2 rounded-md p-2">
              <Flame className="size-5 flex-shrink-0 text-orange-500" />
              <div>
                <span className="font-semibold">{memoizedLeetcoder.max_steak}</span>
                <span className="text-muted-foreground block text-xs">Max Streak</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-md p-2">
              <TrendingUp className="size-5 flex-shrink-0 text-green-500" />
              <div>
                <span className="font-semibold">{memoizedLeetcoder.max_streak_for_cur_year}</span>
                <span className="text-muted-foreground block text-xs">Year Max</span>
              </div>
            </div>
          </div> */}

          <div className="flex items-center justify-between text-sm">
            <div className="text-muted-foreground flex items-center space-x-1">
              <Calendar className="size-3" />
              <span className="text-xs">
                {new Date(memoizedLeetcoder.created_at).toLocaleDateString('default', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {isVisible && (
              <div className="flex space-x-2">
                {memoizedLeetcoder.gh_username && (
                  <a
                    href={getSocialLink(memoizedLeetcoder.gh_username, 'github')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LuGithub
                      size={16}
                      strokeWidth={2}
                    />
                  </a>
                )}
                {memoizedLeetcoder.x_username && (
                  <a
                    href={getSocialLink(memoizedLeetcoder.x_username, 'twitter')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FaXTwitter
                      size={16}
                      strokeWidth={2}
                    />
                  </a>
                )}
                {memoizedLeetcoder.li_username && (
                  <a
                    href={getSocialLink(memoizedLeetcoder.li_username, 'linkedin')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FaLinkedin
                      size={16}
                      strokeWidth={2}
                    />
                  </a>
                )}
                {memoizedLeetcoder.website && (
                  <a
                    href={memoizedLeetcoder.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe
                      size={16}
                      strokeWidth={2}
                    />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
