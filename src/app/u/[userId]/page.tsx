import { fetchLeetcoder } from '@/prisma/dao/leetcoders.dao'

import ProfileView from '@/components/views/profile-view'
import { getUser } from '@/hooks/get-user'
import { notFound } from 'next/navigation'

const Page = async ({ params }: { params: Promise<{ userId: string }> }) => {
  const userId = (await params).userId
  const user = await fetchLeetcoder(userId)

  const currUser = await getUser()
  if (user?.id !== currUser?.id) notFound()

  return <ProfileView user={user!} />
}

export default Page
