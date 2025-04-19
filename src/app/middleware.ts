import { sendAdminNotification } from '@/utils/email/sendEmail'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Pass through to the next middleware/route handler
    return NextResponse.next()
  } catch (error) {
    // Report any uncaught errors
    if (error instanceof Error) {
      await sendAdminNotification({
        error: JSON.stringify(error),
        url: request.url,
        method: request.method,
      })
    }

    // Return an error response
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// This ensures the middleware runs for all routes
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}
