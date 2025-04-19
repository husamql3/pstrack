'use client'

import type { leetcoders } from '@prisma/client'
import { useQueryState } from 'nuqs'
import { Filter, MoreHorizontal, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'
import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/ui/dropdown-menu'
import { Badge } from '@/ui/badge'
import { api } from '@/trpc/react'
import { Input } from '@/ui/input'

// Helper function to truncate email
const truncateEmail = (email: string | null, maxLength = 25) => {
  if (!email) return 'N/A'
  return email.length > maxLength ? `${email.substring(0, maxLength)}...` : email
}

export const DashboardTable = ({ leetcoders }: { leetcoders: leetcoders[] }) => {
  const router = useRouter()
  const { mutate: updateLeetcoderStatus } = api.leetcoders.updateLeetcoderStatus.useMutation({
    onSuccess: (_, variables) => {
      // Refresh the page after successful mutation
      router.refresh()

      // Show success toast with appropriate message based on status
      const statusText =
        variables.status === 'APPROVED'
          ? 'approved'
          : variables.status === 'SUSPENDED'
            ? 'suspended'
            : 'pending'

      toast.success(`User status successfully updated to ${statusText}`, {
        duration: 3000,
      })
    },
    onError: (error) => {
      // Show error toast when mutation fails
      toast.error(`Failed to update status: ${error.message}`, {
        duration: 5000,
      })
    },
  })

  const [statusFilter, setStatusFilter] = useQueryState('leetcoderStatus')
  const [groupFilter, setGroupFilter] = useQueryState('groupNo')
  const [emailFilter, setEmailFilter] = useQueryState('leetcoderEmail')
  const [emailSearch, setEmailSearch] = useState(emailFilter || '')

  // Get unique group numbers for the filter
  const uniqueGroups = Array.from(
    new Set(leetcoders.map((coder) => coder.group_no).filter(Boolean))
  ).sort()

  const filteredLeetcoders = leetcoders.filter((coder) => {
    // Apply status filter
    const statusMatches = !statusFilter || statusFilter === '' || coder.status === statusFilter

    // Apply group filter
    const groupMatches =
      !groupFilter || groupFilter === '' || coder.group_no?.toString() === groupFilter

    // Apply email filter - modified to match prefix or any part of the email
    const emailMatches =
      !emailFilter ||
      emailFilter === '' ||
      coder.email?.toLowerCase().includes(emailFilter.toLowerCase())

    return statusMatches && groupMatches && emailMatches
  })

  const handleStatusUpdate = (id: string, newStatus: 'PENDING' | 'APPROVED' | 'SUSPENDED') => {
    updateLeetcoderStatus({
      id,
      status: newStatus,
    })
  }

  const handleEmailSearch = () => {
    setEmailFilter(emailSearch)
  }

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailSearch(e.target.value)
    if (e.target.value === '') {
      setEmailFilter('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEmailSearch()
    } else if (e.key === 'Escape') {
      setEmailFilter('')
      setEmailSearch('')
    }
  }

  // Add global ESC key listener to clear filters
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmailFilter('')
        setEmailSearch('')
        setStatusFilter('')
        setGroupFilter('')
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [setEmailFilter, setStatusFilter, setGroupFilter])

  return (
    <div className="relative w-5xl overflow-x-auto [&>div]:max-h-svh">
      <div className="mx-auto my-4 flex justify-center">
        <div className="relative flex w-full max-w-sm items-center">
          <Input
            placeholder="Search by email..."
            value={emailSearch}
            onChange={handleEmailInputChange}
            onKeyDown={handleKeyDown}
            className="pr-10"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-0 right-0 h-full px-3"
            onClick={handleEmailSearch}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {emailFilter && (
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => {
              setEmailFilter('')
              setEmailSearch('')
            }}
          >
            Clear Email Filter
          </Button>
        )}
      </div>
      <Table className="[&_td]:border-border [&_th]:border-border w-full min-w-[800px] border-separate border-spacing-0 [&_tfoot_td]:border-t [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
        <TableHeader className="bg-background/90 sticky top-0 z-20 backdrop-blur-sm">
          <TableRow className="hover:bg-transparent">
            <TableHead>Username</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>
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
                    {uniqueGroups.map((group) => (
                      <DropdownMenuCheckboxItem
                        key={group}
                        checked={groupFilter === group?.toString()}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setGroupFilter(group?.toString() || '')
                          } else {
                            setGroupFilter('')
                          }
                        }}
                      >
                        Group {group}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setGroupFilter('')}>
                      Clear Group Filter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableHead>
            <TableHead>
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
                        if (checked) {
                          setStatusFilter('APPROVED')
                        } else {
                          setStatusFilter('')
                        }
                      }}
                    >
                      Approved
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter === 'SUSPENDED'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStatusFilter('SUSPENDED')
                        } else {
                          setStatusFilter('')
                        }
                      }}
                    >
                      Suspended
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter === 'PENDING'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStatusFilter('PENDING')
                        } else {
                          setStatusFilter('')
                        }
                      }}
                    >
                      Pending
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setStatusFilter('')}>
                      Clear Status Filter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableHead>
            <TableHead className="text-right">LeetCode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLeetcoders.length > 0 ? (
            filteredLeetcoders.map(
              ({ id, name, username, email, group_no, lc_username, status }) => (
                <TableRow key={id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium">{username}</div>
                        <span className="text-muted-foreground mt-0.5 text-xs">
                          @{username.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{name || 'N/A'}</TableCell>
                  <TableCell title={email || 'N/A'}>{truncateEmail(email)}</TableCell>
                  <TableCell>{group_no || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {status === 'APPROVED'
                        ? 'Approved'
                        : status === 'SUSPENDED'
                          ? 'Suspended'
                          : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`https://leetcode.com/${lc_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {lc_username}
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-green-600"
                          onClick={() => handleStatusUpdate(id, 'APPROVED')}
                        >
                          Set Approved
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-yellow-600"
                          onClick={() => handleStatusUpdate(id, 'PENDING')}
                        >
                          Set Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleStatusUpdate(id, 'SUSPENDED')}
                        >
                          Set Suspended
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            )
          ) : (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center"
              >
                No records found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
