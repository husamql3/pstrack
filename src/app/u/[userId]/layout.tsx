import { notFound } from 'next/navigation'

import { isValidUUID } from '@/utils/isValidUUID'
import { fetchLeetcoder } from '@/prisma/dao/leetcoders.dao'

import Header from '@/components/landing/header'
import { TrackFooter } from '@/components/track/track-footer'

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ userId: string }>
}) => {
  const userId = (await params).userId
  if (!userId || !isValidUUID(userId)) notFound()

  // check if user exists before rendering the layout
  const userExists = await fetchLeetcoder(userId)
  if (!userExists) notFound()

  return (
    <div className="relative flex h-svh flex-col">
      <Header />

      <main className="mx-auto w-full max-w-xl flex-1">{children}</main>

      <TrackFooter />
    </div>
  )
}

export default Layout
