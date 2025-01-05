import { ColumnDef } from '@tanstack/react-table'
import { TrackTable } from '@/components/track/track-table'

export type Payment = {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
}

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
  },
  {
    accessorKey: 'problem',
    header: 'Problem',
  },
  {
    accessorKey: 'topic',
    header: 'Topic',
  },
  {
    accessorKey: 'difficulty',
    header: 'Difficulty',
  },
  {
    accessorKey: 'count',
    header: 'Count',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
  },
]

const TrackView = () => {
  const data: Payment[] = [
    {
      id: '728ed52f',
      amount: 100,
      status: 'pending',
      email: 'm@example.com',
    },
    {
      id: '728ed52f',
      amount: 100,
      status: 'pending',
      email: 'm@example.com',
    },
    {
      id: '728ed52f',
      amount: 100,
      status: 'pending',
      email: 'm@example.com',
    },
  ]

  return (
    <main className="mx-auto max-w-screen-xl py-5">
      <TrackTable
        columns={columns}
        data={data}
      />
    </main>
  )
}

export { TrackView }
