import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Provider } from '@supabase/supabase-js'
import { createClient } from '@/supabase/client'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()

  // Get current user
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      return session?.user ?? null
    },
  })

  // OAuth sign in mutation
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
      console.error('Sign in error:', error)
    },
  })

  // Sign out mutation
  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.setQueryData(['user'], null)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      router.push('/login')
    },
    onError: (error) => {
      console.error('Sign out error:', error)
    },
  })

  return {
    user,
    isLoadingUser,
    isSigningIn,
    isSigningOut,
    signInWithOAuth,
    signOut,
    isAuthenticated: !!user,
  }
}

export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  GITHUB: 'github',
} as const
