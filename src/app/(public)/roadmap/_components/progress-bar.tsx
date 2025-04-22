'use client'

import { useState, useEffect } from 'react'

import { Progress } from '@/ui/progress'

export const ProgressBar = ({ progress: initialProgress }: { progress?: number }) => {
  const [progressValue, setProgressValue] = useState(initialProgress || 0)

  useEffect(() => {
    if (initialProgress !== undefined) return

    const timer = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) return 100
        return prev + 25
      })
    }, 2000)
    return () => clearInterval(timer)
  }, [initialProgress])

  useEffect(() => {
    if (progressValue >= 100 && initialProgress === undefined)
      setTimeout(() => setProgressValue(0), 4000)
  }, [progressValue, initialProgress])

  return (
    <Progress
      value={progressValue}
      className="w-[300px]"
    />
  )
}
