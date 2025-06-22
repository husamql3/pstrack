import { Star } from 'lucide-react'
import { Suspense } from 'react'

import { REPO_NAME, USERNAME } from '@/data/constants'

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
