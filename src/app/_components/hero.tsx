import { InteractiveHoverLink } from '@/ui/hover-link'

export const Hero = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 md:gap-5 md:px-0">
      <div className="text-center text-4xl font-semibold sm:text-5xl md:text-6xl lg:text-7xl">
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">
          Level Up
        </h1>{' '}
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">
          Your Problem-Solving Game.
        </h1>
      </div>

      <h4 className="text-center text-xl font-medium sm:text-xl md:text-2xl">
        PSTrack: The platform that helps you solve, track, and grow.
      </h4>

      <InteractiveHoverLink
        className="z-[100]"
        href="/groups"
      >
        Get Started
      </InteractiveHoverLink>
    </div>
  )
}
