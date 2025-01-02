import TrackHeader from '@/components/track/track-header'
import TrackTable from '@/components/track/track-table'

const Table = () => {
  return (
    <main className="h-full w-full py-2 pl-0 pr-2">
      <div className="h-full w-full rounded-2xl bg-zinc-900">
        <TrackHeader />
        <TrackTable />
      </div>
    </main>
  )
}

export default Table
