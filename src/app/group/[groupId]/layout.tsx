import { cache } from 'react'
import { notFound } from 'next/navigation'

import { getAllGroupsNo, getGroupByNo } from '@/dao/groups.dao'
import { GroupHeader } from '../_components/group-header'

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

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ groupId: string }>
}) => {
  const { groupId } = await params
  const groupNo = Number(groupId)

  const groupExists = await getGroupExists(groupNo)
  if (!groupExists) {
    notFound()
  }

  return (
    <>
      <GroupHeader groupNo={groupId} />

      <div>GROUP ID: {groupId}</div>
      {children}
    </>
  )
}

export default Layout
