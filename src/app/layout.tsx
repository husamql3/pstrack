import type { Metadata } from 'next'
import { Geist, League_Spartan } from 'next/font/google'

import { cn } from '@/lib/utils'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const geistSans = Geist({
  variable: '--font-geist-sans',
  weight: ['100', '300', '400', '700', '900'],
  subsets: ['latin'],
})

const leagueSpartan = League_Spartan({
  weight: ['700', '900'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PSTrack',
  description: '',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body className={cn('bg-zinc-950 font-sans', geistSans.className, leagueSpartan.className)}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
