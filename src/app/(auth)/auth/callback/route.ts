import { NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

import { sendAdminNotification } from '@/utils/email/sendAdminNotification'
import { env } from '@/config/env.mjs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!code) {
    console.error('No code provided')
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(`${origin}/auth/error`)
  }

  const { data: sessionData } = await supabase.auth.getSession()
  console.log('Session after code exchange:', sessionData)

  return NextResponse.redirect(`${origin}/`)
}
