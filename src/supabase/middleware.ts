import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { env } from '@/config/env.mjs'
import { ADMINS_EMAILS, PROTECTED_ROUTES } from '@/data/constants'

export async function updateSession(request: NextRequest) {
  const { pathname } = new URL(request.url)

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL as string,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  // Get the current user session
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log('Middleware user:', user?.email)

  // Redirect to login if accessing /resources without being logged in
  if (pathname.startsWith('/resources') && !user) {
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
