'use client'

import { useAuth } from '@/hooks/useAuth'
import { useLeetcoder } from '@/hooks/useLeetcoders'
import { api } from '@/trpc/react'

export const User = () => {
  const { user, isLoadingUser } = useAuth()
  const { leetcoder, isLoading: isLoadingLeetcoder } = useLeetcoder(user?.id || '')
  // The error is here - getAllGroupsNo is not being called correctly
  // It should be used with useQuery or similar, not called directly as a function
  const { data: groups } = api.get.getAllGroupsNo.useQuery()
  console.log(groups)

  if (isLoadingUser || isLoadingLeetcoder) {
    return <div>Loading...</div>
  }

  console.log(leetcoder)

    return <div>leetcoder {leetcoder?.username}</div>
}
