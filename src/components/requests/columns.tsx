'use client'

import { ColumnDef } from '@tanstack/react-table'

import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { RequestRow } from '@/types/supabase.type'

export const requestsColumns: ColumnDef<RequestRow>[] = [
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
          className="flex gap-2"
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
