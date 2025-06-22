import { Filter } from 'lucide-react'

import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

export const StatusFilterHeader = ({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: string | null
  setStatusFilter: (value: string | null) => void
}) => (
  <div className="flex items-center space-x-1">
    <span>Status</span>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 h-8 w-8 p-0"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={statusFilter === 'APPROVED'}
          onCheckedChange={(checked) => {
            setStatusFilter(checked ? 'APPROVED' : null)
          }}
        >
          Approved
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={statusFilter === 'SUSPENDED'}
          onCheckedChange={(checked) => {
            setStatusFilter(checked ? 'SUSPENDED' : null)
          }}
        >
          Suspended
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={statusFilter === 'PENDING'}
          onCheckedChange={(checked) => {
            setStatusFilter(checked ? 'PENDING' : null)
          }}
        >
          Pending
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setStatusFilter(null)}>Clear Status Filter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)
