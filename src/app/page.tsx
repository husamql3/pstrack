import { Suspense } from 'react'

import { Footer } from '@/app/_components/footer'
import { Hero } from '@/app/_components/hero'
import { Header } from '@/app/_components/header'
import { StarsBackground } from '@/components/ui/stars-background'

export default function Home() {
  return (
    <div className="flex h-screen flex-col relative">
      <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
        <StarsBackground className="absolute inset-0 -z-10" />
      </Suspense>
      <Header />
      <Hero />
      <Footer />
    </div>
  )
}
