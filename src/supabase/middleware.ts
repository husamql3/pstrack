import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

import { env } from '@/config/env.mjs'

export async function updateSession(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url)
  const code = searchParams.get('code')

  let response = NextResponse.next({
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
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({
            request,
          })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Error exchanging auth code:', error.message)
      } else {
        const redirectUrl = new URL(request.url)
        redirectUrl.searchParams.delete('code')

        const redirectResponse = NextResponse.redirect(redirectUrl)
        for (const cookie of response.cookies.getAll()) {
          redirectResponse.cookies.set(cookie.name, cookie.value)
        }

        return redirectResponse
      }
    } catch (err) {
      console.error('Exception during auth code exchange:', err)
    }
  }

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  console.log('middleware user', user?.email)

  if (pathname.startsWith('/dashboard')) {
    if (!user || user.email !== env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/not-found', request.url))
    }
  }

  return response
}
