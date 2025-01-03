import TrackHeader from '@/components/track/track-header'
import TrackTable from '@/components/track/track-table'

import { getProblems } from '@/db/supabase/services/problem.service'
import { getLeetcoders } from '@/db/supabase/services/leetcoder.service'

const Table = async () => {
  const problems = (await getProblems()) ?? []
  const leetcoders = (await getLeetcoders()) ?? []

  return (
    <main className="h-full w-full py-2 pl-0 pr-2">
      <div className="h-full w-full rounded-2xl bg-zinc-900">
        <TrackHeader />
        <TrackTable
          problems={problems}
          users={leetcoders}
        />
      </div>
    </main>
  )
}

export default Table
