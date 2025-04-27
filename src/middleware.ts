import type { NextRequest } from 'next/server'

import { updateSession } from '@/supabase/middleware'

export function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/login'],
}
