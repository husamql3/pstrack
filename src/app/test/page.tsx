'use client'

import { StarsBackground } from '@/components/ui/stars-background'

export default function Test() {
  return (
    <div className="flex h-screen flex-col">
      <StarsBackground className="absolute inset-0 flex items-center justify-center rounded-xl" />
    </div>
  )
}
