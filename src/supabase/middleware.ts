import { type NextRequest, NextResponse } from 'next/server'

import { ADMINS_EMAILS, PROTECTED_ROUTES } from '@/data/constants'
import { createClient } from './server'
import { getLeetcoderById } from '@/dao/leetcoder.dao'

export async function updateSession(request: NextRequest) {
  const { pathname } = new URL(request.url)

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = await createClient()

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log('Middleware user:', user?.email)

  // Redirect to login if accessing /resources without being logged in
  if (pathname.startsWith('/resources') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check profile access - user must be logged in
  if (pathname === '/profile' && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect specific routes
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    console.log('Middleware route:', pathname)
    if (!user || !user.email || !ADMINS_EMAILS.includes(user.email)) {
      return NextResponse.redirect(new URL('/not-found', request.url))
    }
  }

  return response
}
