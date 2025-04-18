import { Suspense } from 'react'

import { Hero } from '@/app/_components/hero'
import { StarsBackground } from '@/components/ui/stars-background'

export default function Home() {
  return (
    <>
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <StarsBackground className="absolute inset-0 -z-10" />
      </Suspense>
      <Hero />
    </>
  )
}
