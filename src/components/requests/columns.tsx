'use client'

import { ColumnDef } from '@tanstack/react-table'

import { toast } from '@/hooks/use-toast'
import { LeetcoderRow } from '@/types/supabase.type'

import { Button } from '@/components/ui/button'

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
    // cell: ({ row }) => {
    //   const date = new Date(row.original.created_at || '')
    //   // Format the date as "M/D hA" (e.g., "1/1 3AM")
    //   return date.toLocaleString('en-US', {
    //     month: 'numeric', // "1" for January
    //     day: 'numeric',   // "1" for the 1st
    //     hour: 'numeric',  // "3" for 3 AM
    //     hour12: true,     // Use 12-hour format
    //   })
    // },
    cell: ({ row }) => {
      const date = new Date(row.original.created_at || '')
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

          const result = await response.json()
          console.log('Request approved:', result)
          toast({
            title: 'Request Approved',
          })
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
