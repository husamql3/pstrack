import { fetchLeetcoder } from '@/prisma/dao/leetcoders.dao'

import ProfileView from '@/components/views/profile-view'

const Page = async ({ params }: { params: Promise<{ userId: string }> }) => {
  const userId = (await params).userId
  const user = await fetchLeetcoder(userId)

  return <ProfileView user={user} />
}

export default Page
