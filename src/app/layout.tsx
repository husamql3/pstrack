import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'

import { TRPCReactProvider } from '@/trpc/react'
import { cn } from '@/lib/utils'
import './globals.css'

const geist = Geist({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PSTrack',
  description: '',
  openGraph: {}, // todo
  twitter: {}, // todo
}

function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn('dark -tracking-wide antialiased', geist.className)}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster
          position="top-center"
          expand={true}
        />
      </body>
    </html>
  )
}

export default RootLayout
