import type { Provider } from '@supabase/supabase-js'
import { env } from '@/config/env.mjs'
import { createClient } from '@/supabase/client'

export const signIn = async (provider: Provider) => {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        returnTo: env.NEXT_PUBLIC_SITE_URL,
      },
    },
  })

  return { error }
}

export const signOut = async () => {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}
