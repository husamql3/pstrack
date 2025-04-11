'use client'

import { useAuth } from '@/hooks/useAuth'
import { useLeetcoder } from '@/hooks/useLeetcoders'

export const User = () => {
  const { user, isLoadingUser } = useAuth()
  const { leetcoder, isLoading: isLoadingLeetcoder } = useLeetcoder(user?.id || '')

  if (isLoadingUser || isLoadingLeetcoder) {
    return <div>Loading...</div>
  }

  console.log(leetcoder)

  return <div>leetcoder {leetcoder?.username}</div>
}
