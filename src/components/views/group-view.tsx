import { User } from '@supabase/auth-js'

import Sidebar from '@/components/sidebar/sidebar'
import TableSection from '@/components/track/table-section'
import { LeetCoder, Problem } from '@/types/table.type'

const GroupView = ({
  user,
  leetcoders,
  problems,
  groupId,
}: {
  user: User
  leetcoders: LeetCoder[]
  problems: Problem[]
  groupId: string
}) => {
  return (
    <div className="flex h-svh w-svw overflow-hidden">
      <Sidebar user={user} />

      <TableSection
        leetcoders={leetcoders}
        problems={problems}
        groupId={groupId}
        user={user}
      />
    </div>
  )
}

export default GroupView
