'use client'

import { api } from '@/trpc/react'

export const User = () => {
  const { data: user, isLoading: isLoadingUser } = api.auth.getUser.useQuery()
  const { data: leetcoder, isLoading: isLoadingLeetcoder } = api.get.getLeetcoderById.useQuery(
    { id: user?.id || '' },
    { enabled: !!user?.id }
  )

  if (isLoadingUser || isLoadingLeetcoder) {
    return <div>Loading...</div>
  }

  return <div>leetcoder {leetcoder?.username}</div>
}
