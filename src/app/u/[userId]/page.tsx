import ProfileView from '@/components/views/profile-view'

const Page = async ({ params }: { params: Promise<{ userId: string }> }) => {
  const userId = (await params).userId
  console.log(userId)
  return <ProfileView />
}

export default Page
