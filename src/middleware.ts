import type { NextRequest } from 'next/server'

import { updateSession } from '@/supabase/middleware'
import { PROTECTED_ROUTES } from '@/data/constants'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: PROTECTED_ROUTES.map((route) => `${route}/:path*`),
}
