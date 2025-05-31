import { api } from '@/trpc/server'
import { ResourcesTabs } from './_components/resources-tabs'

const Page = async () => {
  const resources = await api.resources.getResources()
  return <ResourcesTabs resources={resources} />
}

export default Page
