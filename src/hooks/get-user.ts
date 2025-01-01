'use server'

import { createClient } from '@/db/supabase/server'
import { User } from '@supabase/auth-js'

export const getUser = async (): Promise<User | null> => {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}
