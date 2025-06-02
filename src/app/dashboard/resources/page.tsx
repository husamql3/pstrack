import { ResourcesAdminTable } from '@/app/dashboard/resources/_components/resources-admin-table'

const ResourcesPage = async () => {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Resources Management</h1>
      <ResourcesAdminTable />
    </div>
  )
}

export default ResourcesPage
