import { NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'
import { sendAdminNotification } from '@/utils/email/sendEmail'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectUrl = new URL('/', request.url)

  if (!code) {
    return NextResponse.redirect(redirectUrl)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Error exchanging code for session:', error)
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }

  // Successfully authenticated
  console.log('User authenticated:', data?.user?.email)

  // Check if this is a new user (first sign-in)
  const { data: userData } = await supabase.auth.getUser()
  const { data: sessionData } = await supabase.auth.getSession()
  const createdAt = new Date(userData?.user?.created_at || '');
  const currentTime = new Date();
  
  // If user was created less than 5 minutes ago, consider them a new user
  const isNewUser = (currentTime.getTime() - createdAt.getTime()) < 5 * 60 * 1000;
  
  if (isNewUser && userData?.user) {
    // Send notification to admin about new user registration
    await sendAdminNotification({
      event: 'NEW_USER_REGISTRATION',
      userId: userData.user.id,
      email: userData.user.email || 'No email provided',
      provider: sessionData?.session?.provider_token ? 'OAuth' : 'Email',
      userMetadata: JSON.stringify(userData.user.user_metadata),
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.redirect(redirectUrl)
}
