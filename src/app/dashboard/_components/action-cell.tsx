import { api } from '@/trpc/react'
import type { leetcoders } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

export const ActionCell = ({ row }: { row: leetcoders }) => {
  const router = useRouter()
  const id = row.id

  const { mutate: sendAcceptanceEmail } = api.email.acceptanceEmail.useMutation()
  const { mutate: updateStatus } = api.leetcoders.updateLeetcoderStatus.useMutation({
    onSuccess: (_, variables) => {
      router.refresh()
      const statusText =
        variables.status === 'APPROVED'
          ? 'approved'
          : variables.status === 'SUSPENDED'
            ? 'suspended'
            : 'pending'
      toast.success(`User status successfully updated to ${statusText}`, { duration: 3000 })

      if (variables.status === 'APPROVED') {
        sendAcceptanceEmail({
          group_no: row.group_no,
          email: row.email,
          username: row.name,
        })
      }
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`, { duration: 5000 })
    },
  })

  const { mutate: deleteLeetcoder } = api.leetcoders.deleteLeetcoder.useMutation({
    onSuccess: () => {
      router.refresh()
      toast.success('Leetcoder successfully deleted', { duration: 3000 })
    },
    onError: (error) => {
      toast.error(`Failed to delete leetcoder: ${error.message}`, { duration: 5000 })
    },
  })

  const handleStatusUpdate = (newStatus: 'PENDING' | 'APPROVED' | 'SUSPENDED') => {
    updateStatus({ id, status: newStatus })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this leetcoder? This action cannot be undone.')) {
      deleteLeetcoder({ id })
    }
  }

  return (
    <div className="text-right">
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
            onClick={() => handleStatusUpdate('APPROVED')}
          >
            Set Approved
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-yellow-600"
            onClick={() => handleStatusUpdate('PENDING')}
          >
            Set Pending
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => handleStatusUpdate('SUSPENDED')}
          >
            Set Suspended
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="font-bold text-red-600"
            onClick={handleDelete}
          >
            Delete Leetcoder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
