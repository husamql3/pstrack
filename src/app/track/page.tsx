'use client'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const Page = () => {
  const { user } = useAuth()
  console.log(user)

  return (
    <div className={cn('flex h-full flex-col items-center justify-center gap-5')}>
      <div className="text-center text-5xl font-semibold">Track Page</div>
    </div>
  )
}

export default Page
