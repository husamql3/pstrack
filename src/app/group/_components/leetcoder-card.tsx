import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'
import type { leetcoders as leetcodersType } from '@prisma/client'
import { Calendar } from 'lucide-react'
import { FaXTwitter } from 'react-icons/fa6'
import { IoLogoGithub } from 'react-icons/io5'
import { IoLogoLinkedin } from 'react-icons/io'

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const extractUsername = (
  input: string,
  platform: 'github' | 'twitter' | 'linkedin'
): string => {
  const patterns = {
    github: /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)\/?$/,
    twitter: /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/?$/,
    linkedin: /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-]+)\/?$/,
  }

  const match = input.match(patterns[platform])
  return match ? match[1] : input
}

export const getSocialLink = (
  username: string,
  platform: 'github' | 'twitter' | 'linkedin'
): string => {
  if (username.startsWith('http')) return username

  const baseUrls = {
    github: 'https://github.com/',
    twitter: 'https://twitter.com/',
    linkedin: 'https://linkedin.com/in/',
  }

  return `${baseUrls[platform]}${username}`
}

export const LeetCoderCard = ({ leetcoder }: { leetcoder: leetcodersType }) => {
  const { data: user } = api.auth.getUser.useQuery()
  const memoizedLeetcoder = useMemo(() => leetcoder, [leetcoder])
  const currUser = user?.id === memoizedLeetcoder.id

  return (
    <HoverCard>
      <div className="flex items-center gap-3">
        <HoverCardTrigger asChild>
          <p className={cn('text-sm font-medium hover:underline', currUser && 'text-emerald-500')}>
            @{memoizedLeetcoder.username}
          </p>
        </HoverCardTrigger>
      </div>
      <HoverCardContent className="w-64 space-y-2 p-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={`https://github.com/${extractUsername(memoizedLeetcoder.gh_username || '', 'github')}.png`}
              />
              <AvatarFallback>{memoizedLeetcoder.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{memoizedLeetcoder.name}</h4>
              <p className="text-muted-foreground text-sm">@{memoizedLeetcoder.lc_username}</p>
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
            <div className="flex space-x-2">
              {memoizedLeetcoder.gh_username && (
                <a
                  href={getSocialLink(memoizedLeetcoder.gh_username, 'github')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IoLogoGithub className="size-4" />
                </a>
              )}
              {memoizedLeetcoder.x_username && (
                <a
                  href={getSocialLink(memoizedLeetcoder.x_username, 'twitter')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FaXTwitter className="size-4" />
                </a>
              )}
              {memoizedLeetcoder.li_username && (
                <a
                  href={getSocialLink(memoizedLeetcoder.li_username, 'linkedin')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IoLogoLinkedin className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
