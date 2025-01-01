import { type NextRequest, NextResponse } from 'next/server'
import { betterFetch } from '@better-fetch/fetch'
import { auth } from '@/db/better-auth/server'

type Session = typeof auth.$Infer.Session

export default async function authMiddleware(request: NextRequest) {
  const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
    baseURL: request.nextUrl.origin,
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  })
  console.log('session', session?.user)

  if (!session) {
    console.log('no session')
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard'],
}
