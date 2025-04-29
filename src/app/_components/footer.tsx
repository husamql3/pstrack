import { Star } from 'lucide-react'
import { Suspense } from 'react'

import { redis } from '@/config/redis'
import { USERNAME, REPO_NAME } from '@/data/constants'

import { GitHubStarsButton } from '@/ui/github-stars'

const GitHubStarsSkeleton = () => (
  <div className="flex h-10 items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-0 text-sm font-medium text-zinc-100 shadow-md">
    <span>GitHub Stars</span>
    <Star
      className="fill-zinc-600 text-zinc-600"
      size={16}
      aria-hidden="true"
    />
    <span>...</span>
  </div>
)

export const Footer = async () => {
  const githubStarsCacheKey = `github:stars:${USERNAME}:${REPO_NAME}`
  let starsCount: number
  const githubStarsCached = (await redis.get(githubStarsCacheKey)) as number | null

  if (githubStarsCached) {
    console.log('##### Using cached GitHub stars data')
    starsCount = githubStarsCached
  } else {
    console.log('GitHub stars cache miss, fetching from API')
    try {
      const response = await fetch(`https://api.github.com/repos/${USERNAME}/${REPO_NAME}`)
      const data = await response.json()
      if (data && typeof data.stargazers_count === 'number') {
        starsCount = data.stargazers_count
        console.log('Caching GitHub stars data for one day')
        await redis.set(githubStarsCacheKey, starsCount, { ex: 86400 }) // cache for one day
      }
    } catch (error) {
      console.error('Error fetching GitHub stars:', error)
    }
  }

  return (
    <footer className="hidden w-full py-4 sm:block">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-4 text-center text-white">
        <p>
          <span className="opacity-50">Built by</span>{' '}
          <a
            href="https://www.husam.ninja/"
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="font-semibold underline decoration-blue-800 underline-offset-2 opacity-100"
          >
            @Hüsam
          </a>
        </p>

        <Suspense fallback={<GitHubStarsSkeleton />}>
          <GitHubStarsButton
            className="max-h-9 w-fit"
            username={USERNAME}
            repo={REPO_NAME}
          />
        </Suspense>
      </div>
    </footer>
  )
}
