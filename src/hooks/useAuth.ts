import type { Provider } from '@supabase/supabase-js'
import { useMutation } from '@tanstack/react-query'

import { createClient } from '@/supabase/client'
import { toast } from 'sonner'

export function useOAuth() {
  const supabase = createClient()

  const { mutate: signInWithOAuth, isPending: isSigningIn } = useMutation({
    mutationFn: async (provider: Provider) => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            returnTo: window.location.pathname,
          },
        },
      })
      if (error) throw error
    },
    onError: (error) => {
      console.error(error)
    },
  })

  return {
    isSigningIn,
    signInWithOAuth,
  }
}
