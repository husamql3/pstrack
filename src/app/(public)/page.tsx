import { InteractiveHoverLink } from '@/ui/hover-link'
import { HeroVideoDialog } from '@/ui/hero-video-dialog'

const Page = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 md:gap-5 md:px-0">
      <div className="hidden pt-20 text-center text-4xl font-semibold sm:block sm:text-5xl md:text-6xl">
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
        PSTrack: The platform that helps you solve, track, and grow.
      </h4>

      <InteractiveHoverLink
        href="/groups"
        className="mb-10"
      >
        Get Started
      </InteractiveHoverLink>

      <div className="px-3 pb-10">
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
          thumbnailSrc="/hero.png"
          thumbnailAlt="Hero Video"
        />
      </div>
    </div>
  )
}

export default Page
