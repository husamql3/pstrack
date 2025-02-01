import type { Metadata } from 'next'
import { League_Spartan, Roboto } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'

import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import './globals.css'

const leagueSpartan = League_Spartan({
  weight: ['700', '900'],
  subsets: ['latin'],
})

const roboto = Roboto({
  weight: ['100', '300', '400', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'PSTrack',
  description: 'A platform that helps you solve, track, and grow in problem-solving.',
  openGraph: {
    title: 'PSTrack',
    description: 'Level up your problem-solving game with PSTrack',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PSTrack',
    description: 'Level up your problem-solving game with PSTrack',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const prod = process.env.NODE_ENV === 'production'

  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body className={cn('bg-zinc-950 font-roboto', roboto.className, leagueSpartan.className)}>
        {children}
        <Toaster />
        {prod && <Analytics />}
      </body>
    </html>
  )
}
