'use client'

import type { groups, leetcoders } from '@prisma/client'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ExternalLink, Search } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'
import { LeetcoderDetailDialog } from './leetcoder-detail-dialog'

const columnHelper = createColumnHelper<leetcoders>()

interface DashboardTableProps {
  leetcoders: leetcoders[]
  groups: groups[]
}

export const DashboardTable = ({ leetcoders, groups }: DashboardTableProps) => {
  const [search, setSearch] = useQueryState('search', { defaultValue: '' })
  const [statusFilter, setStatusFilter] = useQueryState('status', {
    defaultValue: 'all',
  })
  const [groupFilter, setGroupFilter] = useQueryState('group', {
    defaultValue: 'all',
  })
  const [currentPage, setCurrentPage] = useState(1)

  const limit = 50

  // Filter data based on applied filters - memoized properly
  const filteredData = useMemo(() => {
    if (!leetcoders) return []

    return leetcoders.filter((coder) => {
      const statusMatches = statusFilter === 'all' || coder.status === statusFilter
      const groupMatches = groupFilter === 'all' || coder.group_no?.toString() === groupFilter
      const searchMatches =
        !search ||
        search.trim() === '' ||
        coder.username?.toLowerCase().includes(search.toLowerCase()) ||
        coder.name?.toLowerCase().includes(search.toLowerCase()) ||
        coder.email?.toLowerCase().includes(search.toLowerCase()) ||
        coder.lc_username?.toLowerCase().includes(search.toLowerCase())

      return statusMatches && groupMatches && searchMatches
    })
  }, [leetcoders, statusFilter, groupFilter, search])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, groupFilter])

  // Pagination - memoized
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredData.length / limit)
    const startIndex = (currentPage - 1) * limit
    const paginatedData = filteredData.slice(startIndex, startIndex + limit)

    return {
      data: paginatedData,
      totalPages,
      totalCount: filteredData.length,
    }
  }, [filteredData, currentPage, limit])

  // Memoized handlers
  const handleClearFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('all')
    setGroupFilter('all')
    setCurrentPage(1)
  }, [setSearch, setStatusFilter, setGroupFilter])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value)
    },
    [setSearch]
  )

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatusFilter(value)
    },
    [setStatusFilter]
  )

  const handleGroupChange = useCallback(
    (value: string) => {
      setGroupFilter(value)
    },
    [setGroupFilter]
  )

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(paginationData.totalPages, prev + 1))
  }, [paginationData.totalPages])

  // Memoized status functions
  const getStatusVariant = useCallback((status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default'
      case 'PENDING':
        return 'secondary'
      case 'SUSPENDED':
        return 'destructive'
      default:
        return 'outline'
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600'
      case 'PENDING':
        return 'text-yellow-600'
      case 'SUSPENDED':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }, [])

  // Memoized columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('username', {
        header: 'Username',
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue()}</div>
            <div className="text-muted-foreground text-xs">@{info.getValue().toLowerCase()}</div>
          </div>
        ),
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue() || 'N/A'}</div>
            <div
              className="text-muted-foreground max-w-[200px] truncate text-xs"
              title={info.row.original.email || 'N/A'}
            >
              {info.row.original.email || 'N/A'}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('group_no', {
        header: 'Group',
        cell: (info) => <Badge variant="outline">Group {info.getValue() || 'N/A'}</Badge>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant={getStatusVariant(info.getValue())}
            className={getStatusColor(info.getValue())}
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('lc_username', {
        header: 'LeetCode',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <span className="text-sm">{info.getValue()}</span>
            {info.getValue() && (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`https://leetcode.com/${info.getValue()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor((row) => row, {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <LeetcoderDetailDialog leetcoder={info.getValue()}>
            <Button
              variant="outline"
              size="sm"
            >
              View Details
            </Button>
          </LeetcoderDetailDialog>
        ),
      }),
    ],
    [getStatusVariant, getStatusColor]
  )

  // Initialize TanStack Table
  const table = useReactTable({
    data: paginationData.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-muted/50 flex flex-wrap items-center gap-4 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="search">Search:</Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="Search leetcoders..."
              value={search}
              onChange={handleSearchChange}
              className="w-64"
            />
            <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status:</Label>
          <Select
            value={statusFilter}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="group-filter">Group:</Label>
          <Select
            value={groupFilter}
            onValueChange={handleGroupChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups?.map((group) => (
                <SelectItem
                  key={group.group_no}
                  value={group.group_no.toString()}
                >
                  Group {group.group_no}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleClearFilters}
        >
          Clear Filters
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-sm">
          Showing {paginationData.data.length} of {paginationData.totalCount} leetcoders
        </div>
        {paginationData.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {paginationData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === paginationData.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  No leetcoders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
