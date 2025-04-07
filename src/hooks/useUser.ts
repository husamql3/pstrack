import type { User } from '@supabase/supabase-js'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { createClient } from '@/supabase/client'

const useUser = (): UseQueryResult<User | null, Error> => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        throw error
      }

      return user
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}

export default useUser
