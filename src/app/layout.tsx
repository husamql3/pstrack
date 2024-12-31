import type { Metadata } from 'next'
import { Geist } from 'next/font/google'

import { cn } from '@/lib/utils'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  weight: ['100', '300', '400', '700', '900'],
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PSTrack',
}

export default function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"
          className="dark">
    <body className={cn(geistSans.variable)}>
    {children}
    </body>
    </html>
  )
}
