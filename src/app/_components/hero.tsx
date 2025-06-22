import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/utils/cn'

export const Hero = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 md:gap-5 md:px-0">
      <div className="hidden text-center text-4xl font-semibold sm:block sm:text-5xl md:text-6xl lg:text-7xl">
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">Level Up</h1>{' '}
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">
          Your Problem-Solving Game.
        </h1>
      </div>

      <div className="block text-center text-3xl font-semibold sm:hidden">
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">Level Up Your</h1>
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">
          Problem-Solving Game.
        </h1>
      </div>

      <h4 className="text-center text-base font-medium sm:text-lg md:text-xl">
        The platform that helps you solve, track, and grow.
      </h4>

      <CTA />
    </div>
  )
}

const CTA = () => {
  return (
    <Link
      href="/groups"
      prefetch={true}
      className={cn(
        'group bg-foreground border-zinc- relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold',
        'z-[100]'
      )}
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-zinc-900 transition-all duration-300 group-hover:scale-[100.8]" />
        <span className="inline-block text-zinc-900 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          Get Started
        </span>
      </div>
      <div className="text-primary absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span>Get Started</span>
        <ArrowRight />
      </div>
    </Link>
  )
}
