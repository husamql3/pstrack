import { LeetCoder, Problem } from '@/types/table.type'
import TrackTable from '@/components/track/track-table'
import { RequestToJoin } from '@/components/track/request-to-join'

const TableSection = ({
  leetcoders,
  problems,
  groupId,
}: {
  leetcoders: LeetCoder[]
  problems: Problem[]
  groupId: string
}) => {
  console.log(groupId)

  return (
    <main className="h-full w-full py-2 pl-0 pr-2">
      <div className="h-full w-full rounded-2xl bg-zinc-900">
        {/* table header */}
        <div className="flex items-center justify-between p-4">
          <p>Group {groupId}</p>
          <RequestToJoin />
        </div>

        <TrackTable
          problems={problems}
          users={leetcoders}
        />
      </div>
    </main>
  )
}

export default TableSection
