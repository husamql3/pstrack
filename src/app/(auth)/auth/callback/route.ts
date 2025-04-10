import { NextResponse } from 'next/server'

import { createClient } from '@/supabase/server'


export async function GET(request: Request) {
  console.log("Auth callback route triggered")
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  console.log("Auth code received:", code ? "present" : "missing")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log("Session exchange result:", error ? "error" : "success")

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/error', request.url))
    }

    // Successfully authenticated
    console.log("User authenticated:", data?.user?.email)
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
