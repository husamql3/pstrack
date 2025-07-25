import { GoogleAnalytics } from '@next/third-parties/google'
import { Geist } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from 'sonner'

import { DevTab } from '@/app/_components/dev-tab'
import { siteMetaData } from '@/data/metadata'
import { TRPCReactProvider } from '@/trpc/react'
import { cn } from '@/utils/cn'
import './globals.css'

const geist = Geist({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = siteMetaData

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const gaId = process.env.GA_MEASUREMENT_ID

  return (
    <html
      lang="en"
      className="dark"
    >
      <body className={cn('dark bg-neutral-950 -tracking-wide antialiased', geist.className)}>
        <TRPCReactProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </TRPCReactProvider>

        <DevTab />

        <Toaster
          position="top-center"
          expand={true}
          toastOptions={{
            classNames: {
              error: 'bg-red-400',
              success: 'text-green-400',
              warning: 'text-yellow-400',
              info: 'bg-blue-400',
            },
          }}
        />

        <GoogleAnalytics gaId={gaId || ''} />
      </body>
    </html>
  )
}

export default RootLayout
