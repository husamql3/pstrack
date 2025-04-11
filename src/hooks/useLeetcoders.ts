import { useQuery } from '@tanstack/react-query'

import { getLeetcoderById } from '@/dao/leetcoder.dao'

export function useLeetcoder(id: string) {
  const { data: leetcoder, isLoading } = useQuery({
    queryKey: ['leetcoder', id],
    queryFn: async () => {
      return getLeetcoderById(id)
    },
  })

  return { leetcoder, isLoading }
}
