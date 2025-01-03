import type { Metadata } from 'next'
import { League_Spartan, Roboto } from 'next/font/google'

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
      <body
        className={cn(
          'font-roboto bg-zinc-950',
          roboto.className,
          leagueSpartan.className
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
