import { NextResponse } from 'next/server'

import { createClient } from '@/supabase/server'
import { sendAdminNotification } from '@/utils/email/sendAdminNotification'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

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

  // Check if this is a new user (first sign-in)
  const { data: userData } = await supabase.auth.getUser()
  const { data: sessionData } = await supabase.auth.getSession()
  const createdAt = new Date(userData?.user?.created_at || '')
  const currentTime = new Date()

  // If user was created less than 5 minutes ago, consider them a new user
  const isNewUser = currentTime.getTime() - createdAt.getTime() < 5 * 60 * 1000

  // Send notification to admin about new user registration
  if (isNewUser && userData?.user) {
    await sendAdminNotification({
      event: 'NEW_USER_REGISTRATION',
      userId: userData.user.id,
      email: userData.user.email || 'No email provided',
      provider: sessionData?.session?.provider_token ? 'OAuth' : 'Email',
      userMetadata: JSON.stringify(userData.user.user_metadata),
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.redirect(`${origin}/`)
}
