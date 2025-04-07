import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className={cn('flex min-h-svh flex-col items-center justify-center gap-5')}>
      <div className="text-center text-5xl font-semibold">
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">
          Level Up
        </h1>{' '}
        <h1 className="bg-gradient-to-b from-neutral-50 to-neutral-600 bg-clip-text text-transparent">
          Your Problem-Solving Game.
        </h1>
      </div>

      <h4 className="text-xl">PSTrack: The platform that helps you solve, track, and grow.</h4>
    </div>
  )
}
