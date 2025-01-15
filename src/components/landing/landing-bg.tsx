import { Spotlight } from '@/components/ui/spotlight'

export const LandingBg = () => {
  return (
    <div className="bg-grid-white/[0.02] absolute flex h-svh w-full overflow-hidden rounded-md bg-black/[0.96] antialiased md:items-center md:justify-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
          backgroundSize: '40px 40px',
          mask: 'radial-gradient(circle at 50% 50%, black, transparent 70%)',
          WebkitMask: 'radial-gradient(circle at 50% 50%, black, transparent 70%)',
        }}
      />
      <Spotlight
        className="-top-40 left-0 md:-top-20 md:left-60"
        fill="white"
      />
    </div>
  )
}
