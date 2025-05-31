import { api } from '@/trpc/server'
import { AddNewResourceBtn } from '../(public)/resources/_components/add-new-resource-btn'

const Page = async () => {
  const resources = await api.resources.getResources()
  console.log(resources)

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <AddNewResourceBtn />
    </div>
  )
}

export default Page
