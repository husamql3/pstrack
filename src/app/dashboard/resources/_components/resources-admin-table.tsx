'use client'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ExternalLink, Loader2, Search, Trash2 } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/trpc/react'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { Switch } from '@/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'

type ResourceWithRelations = {
  id: string
  title: string
  url: string
  topic: string
  contributor: string
  is_visible: boolean
  is_approved: boolean
  created_at: Date
  type: { name: string }
  tab: { name: string }
}

const columnHelper = createColumnHelper<ResourceWithRelations>()

export const ResourcesAdminTable = () => {
  const [search, setSearch] = useQueryState('search', { defaultValue: '' })
  const [showPendingOnly, setShowPendingOnly] = useQueryState('pending', {
    defaultValue: false,
    parse: (value) => value === 'true',
    serialize: (value) => (value ? 'true' : 'false'),
  })
  const [tabFilter, setTabFilter] = useQueryState('tab', {
    defaultValue: 'all',
  })
  const [typeFilter, setTypeFilter] = useQueryState('type', {
    defaultValue: 'all',
  })
  const [currentPage, setCurrentPage] = useState(1)

  const utils = api.useContext()

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, showPendingOnly, tabFilter, typeFilter])

  // Fetch data with proper filter values
  const {
    data: resourcesData,
    isLoading,
    error,
  } = api.resources.getAllResourcesAdmin.useQuery({
    page: currentPage,
    limit: 50,
    showPendingOnly,
    tabFilter: tabFilter === 'all' ? undefined : tabFilter,
    typeFilter: typeFilter === 'all' ? undefined : typeFilter,
    search: search.trim() === '' ? undefined : search,
  })

  const { data: tabs } = api.resources.getResourceTabs.useQuery()
  const { data: types } = api.resources.getResourceTypes.useQuery()

  // Mutations
  const { mutate: updateResource, isPending: isUpdating } = api.resources.updateResourceAdmin.useMutation({
    onSuccess: () => {
      utils.resources.getAllResourcesAdmin.invalidate()
      toast.success('Resource updated successfully')
    },
    onError: (error) => toast.error(error.message),
  })

  const { mutate: deleteResource, isPending: isDeleting } = api.resources.deleteResourceAdmin.useMutation({
    onSuccess: () => {
      utils.resources.getAllResourcesAdmin.invalidate()
      toast.success('Resource deleted successfully')
    },
    onError: (error) => toast.error(error.message),
  })

  // Memoized handlers
  const handleApprovalToggle = useCallback(
    (id: string, isApproved: boolean) => {
      updateResource({ id, is_approved: isApproved })
    },
    [updateResource]
  )

  const handleVisibilityToggle = useCallback(
    (id: string, isVisible: boolean) => {
      updateResource({ id, is_visible: isVisible })
    },
    [updateResource]
  )

  const handleDelete = useCallback(
    (id: string, title: string) => {
      if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
        deleteResource({ id })
      }
    },
    [deleteResource]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value)
    },
    [setSearch]
  )

  const handleClearFilters = useCallback(() => {
    setSearch('')
    setShowPendingOnly(false)
    setTabFilter('all')
    setTypeFilter('all')
    setCurrentPage(1)
  }, [setSearch, setShowPendingOnly, setTabFilter, setTypeFilter])

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(resourcesData?.totalPages || 1, prev + 1))
  }, [resourcesData?.totalPages])

  // Define columns - must be called before any conditional returns
  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => (
          <div className="max-w-xs">
            <div
              className="truncate font-medium"
              title={info.getValue()}
            >
              {info.getValue()}
            </div>
            <div className="text-muted-foreground text-xs">{info.row.original.topic}</div>
          </div>
        ),
      }),
      columnHelper.accessor('tab.name', {
        header: 'Tab',
        cell: (info) => <Badge variant="outline">{info.getValue().replace('_', ' ')}</Badge>,
      }),
      columnHelper.accessor('type.name', {
        header: 'Type',
        cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge>,
      }),
      columnHelper.accessor('contributor', {
        header: 'Contributor',
        cell: (info) => info.getValue() || 'Unknown',
      }),
      columnHelper.accessor('is_approved', {
        header: 'Approved',
        cell: (info) => (
          <Switch
            checked={info.getValue()}
            onCheckedChange={(checked) => handleApprovalToggle(info.row.original.id, checked)}
            disabled={isUpdating}
          />
        ),
      }),
      columnHelper.accessor('is_visible', {
        header: 'Visible',
        cell: (info) => (
          <Switch
            checked={info.getValue()}
            onCheckedChange={(checked) => handleVisibilityToggle(info.row.original.id, checked)}
            disabled={isUpdating}
          />
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={info.getValue().url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(info.getValue().id, info.getValue().title)}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {!isDeleting && <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        ),
      }),
    ],
    [handleApprovalToggle, handleVisibilityToggle, handleDelete, isUpdating, isDeleting]
  )

  // Initialize TanStack Table - must be called before any conditional returns
  const table = useReactTable({
    data: resourcesData?.resources || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Show error state after all hooks are defined
  if (error) {
    return (
      <div className="space-y-4">
        <div className="py-12 text-center">
          <p className="font-medium text-red-600">Error loading resources</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-muted/50 flex flex-wrap items-center gap-4 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="search">Search:</Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="Search resources..."
              value={search}
              onChange={handleSearchChange}
              className="w-64"
            />
            <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="pending">Show Pending Only:</Label>
          <Switch
            id="pending"
            checked={showPendingOnly}
            onCheckedChange={setShowPendingOnly}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="tab-filter">Tab:</Label>
          <Select
            value={tabFilter}
            onValueChange={setTabFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tabs</SelectItem>
              {tabs?.map((tab) => (
                <SelectItem
                  key={tab.value}
                  value={tab.label}
                >
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="type-filter">Type:</Label>
          <Select
            value={typeFilter}
            onValueChange={setTypeFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types?.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.label}
                >
                  {type.label}
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
      {resourcesData && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Showing {resourcesData.resources.length} of {resourcesData.totalCount} resources
          </div>
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
              Page {currentPage} of {resourcesData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === resourcesData.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
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
                  No resources found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
