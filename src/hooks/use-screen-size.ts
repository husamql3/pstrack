'use client'

import { useEffect, useState } from 'react'

export const useScreenSize = () => {
  const [isLargeScreen, setIsLargeScreen] = useState<boolean | null>(null)

  useEffect(() => {
    const checkScreenSize = () => {
      // lg breakpoint in Tailwind is 1024px
      setIsLargeScreen(window.innerWidth >= 1024)
    }

    // Set initial value
    checkScreenSize()

    // Add event listener
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return isLargeScreen
}
