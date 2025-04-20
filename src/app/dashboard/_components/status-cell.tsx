import { Badge } from '@/ui/badge'

export const StatusCell = ({ status }: { status: string }) => (
  <Badge
    className={
      status === 'APPROVED'
        ? 'bg-green-100 text-green-800'
        : status === 'SUSPENDED'
          ? 'bg-red-100 text-red-800'
          : 'bg-yellow-100 text-yellow-800'
    }
  >
    {status === 'APPROVED' ? 'Approved' : status === 'SUSPENDED' ? 'Suspended' : 'Pending'}
  </Badge>
)
