import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { ShimmerButton } from '@/components/ui/shimmer-button'

const Hero = () => {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center px-3 md:px-0">
      <h1 className="bg-opacity-50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-3xl font-bold text-transparent md:text-5xl">
        Level Up Your <br />
        Problem-Solving Game.
      </h1>
      <p className="mt-4 text-center text-sm font-normal text-neutral-300 md:text-lg">
        PSTrack: The platform that helps you solve, track, and grow.
      </p>

      <Link
        href="/g/1"
        className="mt-9"
        prefetch
      >
        <ShimmerButton className="shadow-2xl">
          <span className="text-center text-sm text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
            Get Started
          </span>
          <ChevronRight className="ml-2 h-4 w-4 text-white" />
        </ShimmerButton>
      </Link>
    </div>
  )
}

export default Hero
