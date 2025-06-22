import { notFound } from 'next/navigation'
import { cache } from 'react'
import { GroupHeader } from '@/app/group/_components/group-header'
import { redis } from '@/config/redis'
import { getAllGroupsNo, getGroupByNo } from '@/dao/groups.dao'

// generateStaticParams for groups
export async function generateStaticParams() {
  const groups = await getAllGroupsNo()
  return groups.map((group) => ({
    groupId: group.group_no.toString(),
  }))
}

// cache the group validation for better performance
const getGroupExists = cache(async (groupId: number): Promise<boolean> => {
  const group = await getGroupByNo(groupId)
  return !!group
})

const Layout = async ({ children, params }: { children: React.ReactNode; params: Promise<{ groupId: string }> }) => {
  const { groupId } = await params
  const groupNo = Number(groupId)

  const groupExists = await getGroupExists(groupNo)
  if (!groupExists) {
    notFound()
  }

  const cacheKey = `group:${groupId}:data`
  await redis.del(cacheKey)

  return (
    <div className="flex min-h-screen flex-col">
      <GroupHeader groupNo={groupId} />
      {children}
    </div>
  )
}

export default Layout
