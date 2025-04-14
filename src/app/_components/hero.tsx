import Link from 'next/link'

export const Hero = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5">
      <div className="text-center text-5xl font-semibold">
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">
          Level Up
        </h1>{' '}
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">
          Your Problem-Solving Game.
        </h1>
      </div>

      <h4 className="text-xl font-medium">
        PSTrack: The platform that helps you solve, track, and grow.
      </h4>

      <Link href="/group/1">Group</Link>
    </div>
  )
}
