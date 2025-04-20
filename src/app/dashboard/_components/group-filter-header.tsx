import type { groups } from '@prisma/client'
import { Filter } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/ui/dropdown-menu'
import { Button } from '@/ui/button'

export const GroupFilterHeader = ({
  groups,
  groupFilter,
  setGroupFilter,
}: {
  groups: groups[]
  groupFilter: string | null
  setGroupFilter: (value: string | null) => void
}) => (
  <div className="flex items-center space-x-1">
    <span>Group</span>
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
        <DropdownMenuLabel>Filter by Group</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groups
          .sort((a, b) => (a.group_no || 0) - (b.group_no || 0))
          .map(({ id, group_no }) => (
            <DropdownMenuCheckboxItem
              key={id}
              checked={groupFilter === group_no?.toString()}
              onCheckedChange={(checked) => {
                setGroupFilter(checked ? group_no?.toString() || null : null)
              }}
            >
              Group {group_no}
            </DropdownMenuCheckboxItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setGroupFilter(null)}>Clear Group Filter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)
