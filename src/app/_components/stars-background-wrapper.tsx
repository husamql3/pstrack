'use client'

import { Suspense } from 'react'

import { useIsMobile } from '@/hooks/use-mobile'
import { StarsBackground } from '@/ui/stars-background'

export const StarsBackgroundWrapper = () => {
  const isMobile = useIsMobile()

  if (isMobile) return null

  return (
    <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
      <StarsBackground className="fixed inset-0 -z-10" />
    </Suspense>
  )
}
