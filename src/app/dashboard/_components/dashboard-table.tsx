'use client'

import Link from 'next/link'
import type { groups, leetcoders } from '@prisma/client'
import { useQueryState } from 'nuqs'
import { Search, Loader2 } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { api as trpc } from '@/trpc/react'
import type { TRPCClientErrorLike } from '@trpc/react-query'
import type { AppRouter } from '@/server/root'
import { ActionCell } from '@/app/dashboard/_components/action-cell'
import { StatusCell } from '@/app/dashboard/_components/status-cell'
import { GroupFilterHeader } from '@/app/dashboard/_components/group-filter-header'
import { StatusFilterHeader } from '@/app/dashboard/_components/status-filter-header'
import { toast } from 'sonner'

// Helper function to truncate email
const truncateEmail = (email: string | null, maxLength = 25) => {
  if (!email) return 'N/A'
  return email.length > maxLength ? `${email.substring(0, maxLength)}...` : email
}

const columnHelper = createColumnHelper<leetcoders>()

export const DashboardTable = ({ leetcoders, groups }: { leetcoders: leetcoders[]; groups: groups[] }) => {
  const [statusFilter, setStatusFilter] = useQueryState('leetcoderStatus')
  const [groupFilter, setGroupFilter] = useQueryState('groupNo')
  const [emailFilter, setEmailFilter] = useQueryState('leetcoderEmail')
  const [emailSearch, setEmailSearch] = useState(emailFilter || '')
  const [sorting, setSorting] = useState<SortingState>([])

  const utils = trpc.useContext()
  const changeGroupMutation = trpc.leetcoders.changeGroup.useMutation({
    onSuccess: () => {
      utils.leetcoders.getAllLeetcoders.invalidate()
      toast.success('Group changed successfully.')
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      toast.error(error.message || 'Failed to change group.')
    },
  })

  const handleEmailSearch = () => {
    setEmailFilter(emailSearch || null)
  }

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSearch(e.target.value)
    if (e.target.value === '') {
      setEmailFilter(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEmailSearch()
    } else if (e.key === 'Escape') {
      setEmailFilter(null)
      setEmailSearch('')
    }
  }

  // Global ESC key listener to clear filters
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmailFilter(null)
        setEmailSearch('')
        setStatusFilter(null)
        setGroupFilter(null)
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [setEmailFilter, setStatusFilter, setGroupFilter])

  // Filter data based on applied filters
  const filteredData = useMemo(() => {
    return leetcoders.filter((coder) => {
      const statusMatches = !statusFilter || coder.status === statusFilter
      const groupMatches = !groupFilter || coder.group_no?.toString() === groupFilter
      const emailMatches = !emailFilter || coder.email?.toLowerCase().includes(emailFilter.toLowerCase())

      return statusMatches && groupMatches && emailMatches
    })
  }, [leetcoders, statusFilter, groupFilter, emailFilter])

  // Define columns for TanStack Table
  const columns = useMemo(
    () => [
      columnHelper.accessor('username', {
        header: 'Username',
        cell: (info) => (
          <div className="flex items-center">
            <div>
              <div className="font-medium">{info.getValue()}</div>
              <span className="text-muted-foreground mt-0.5 text-xs">@{info.getValue().toLowerCase()}</span>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue() || 'N/A',
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => <span title={info.getValue() || 'N/A'}>{truncateEmail(info.getValue())}</span>,
      }),
      columnHelper.accessor('group_no', {
        header: () => (
          <GroupFilterHeader
            groups={groups}
            groupFilter={groupFilter}
            setGroupFilter={setGroupFilter}
          />
        ),
        cell: (info) => info.getValue() || 'N/A',
      }),
      columnHelper.display({
        id: 'changeGroup',
        header: 'Change Group',
        cell: ({ row }) => {
          const userId = row.original.id
          const currentGroup = row.original.group_no

          return (
            <div className="flex items-center">
              {groups.length === 0 ? (
                <span>No groups available</span>
              ) : (
                <>
                  <select
                    value={currentGroup?.toString() || ''}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const newGroupNo = parseInt(e.target.value, 10)
                      if (newGroupNo === currentGroup) {
                        toast.info('User is already in this group.')
                        return
                      }
                      changeGroupMutation.mutate({
                        userId,
                        newGroupNo,
                      })
                    }}
                    disabled={changeGroupMutation.isPending}
                    className="rounded border px-2 py-1"
                  >
                    {groups.map((group) => (
                      <option
                        key={group.group_no}
                        value={group.group_no}
                      >
                        Group {group.group_no}
                      </option>
                    ))}
                  </select>
                  {changeGroupMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                </>
              )}
            </div>
          )
        },
      }),
      columnHelper.accessor('status', {
        header: () => (
          <StatusFilterHeader
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        ),
        cell: (info) => <StatusCell status={info.getValue()} />,
      }),
      columnHelper.accessor('lc_username', {
        header: () => <div className="text-right">LeetCode</div>,
        cell: (info) => (
          <div className="text-right">
            <a
              href={`https://leetcode.com/${info.getValue()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {info.getValue()}
            </a>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row, {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => <ActionCell row={info.getValue()} />,
      }),
    ],
    [groups, groupFilter, statusFilter, setGroupFilter, setStatusFilter, changeGroupMutation]
  )

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Default to sorting by username ascending
    initialState: {
      sorting: [{ id: 'username', desc: false }],
    },
  })

  return (
    <div className="flex flex-col space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 pt-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            prefetch
            className="text-blue-500 hover:underline"
          >
            Back to Home
          </Link>

          <div className="relative flex items-center">
            <Input
              placeholder="Search by email..."
              value={emailSearch}
              onChange={handleEmailInputChange}
              onKeyDown={handleKeyDown}
              className="w-full max-w-sm pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 h-full px-3"
              onClick={handleEmailSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {emailFilter && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEmailFilter(null)
              setEmailSearch('')
            }}
          >
            Clear Email Filter
          </Button>
        )}
      </div>

      {/* Table wrapper with proper scrolling */}
      <div className="overflow-x-auto">
        <Table className="w-full min-w-lg border-separate border-spacing-0">
          <TableHeader className="bg-background/95 sticky top-0 z-20 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                  >
                    <span className="flex items-center">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: '↓',
                        desc: '↑',
                      }[header.column.getIsSorted() as string] ?? ''}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
