'use client'

import { ColumnDef } from '@tanstack/react-table'
import { BiShowAlt } from 'react-icons/bi'

import { toast } from '@/hooks/use-toast'
import { LeetcoderRow } from '@/types/supabase.type'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export const requestsColumns: ColumnDef<LeetcoderRow>[] = [
  {
    accessorKey: 'username',
    header: 'Username',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'group_no',
    header: 'Group',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'created_at',
    header: 'Requested At',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at || '') // todo: Jan 01, hh:mm AM
      return date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        hour12: true,
      })
    },
    sortingFn: 'datetime', // Use the built-in datetime sorting function
  },
  {
    accessorKey: 'details',
    header: 'Details',
    cell: ({ row }) => {
      const request = row.original
      return (
        <Popover>
          <PopoverTrigger>
            <BiShowAlt className="cursor-pointer" /> {/* Add a pointer cursor */}
          </PopoverTrigger>
          <PopoverContent className="w-[500px] p-4">
            <pre className="whitespace-pre-wrap break-words text-sm">
              {JSON.stringify(request, null, 2)}
            </pre>
          </PopoverContent>
        </Popover>
      )
    },
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const handleApprove = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        try {
          const response = await fetch(`/api/request?id=${row.original.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          })

          if (!response.ok) {
            throw new Error('Failed to approve request')
          }

          await response.json()
          toast({
            title: 'Request Approved',
          })
          window.location.reload()
        } catch (error) {
          console.error('Error approving request:', error)
          toast({
            title: 'Error approving request',
            variant: 'destructive',
          })
        }
      }

      const request = row.original
      return (
        <form
          onSubmit={handleApprove}
          className="flex gap-2 self-center"
        >
          <Button
            variant="outline"
            size="sm"
            type="submit"
            onClick={() => console.log(request.id)}
          >
            Approve
          </Button>
        </form>
      )
    },
  },
]
