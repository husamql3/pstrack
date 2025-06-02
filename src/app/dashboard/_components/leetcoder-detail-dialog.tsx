'use client'

import { useState } from 'react'
import { Button } from '@/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog'
import { Badge } from '@/ui/badge'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Loader2, ExternalLink } from 'lucide-react'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import type { leetcoders } from '@prisma/client'

interface LeetcoderDetailDialogProps {
  leetcoder: leetcoders
  children: React.ReactNode
}

export const LeetcoderDetailDialog = ({ leetcoder, children }: LeetcoderDetailDialogProps) => {
  const [open, setOpen] = useState(false)
  const [editedData, setEditedData] = useState({
    name: leetcoder.name || '',
    username: leetcoder.username || '',
    email: leetcoder.email || '',
    lc_username: leetcoder.lc_username || '',
    gh_username: leetcoder.gh_username || '',
  })

  const utils = api.useContext()

  const { mutate: updateStatus, isPending: isUpdatingStatus } = api.leetcoders.updateLeetcoderStatus.useMutation({
    onSuccess: (_, variables) => {
      utils.leetcoders.getAllLeetcoders.invalidate()
      const statusText =
        variables.status === 'APPROVED' ? 'approved' : variables.status === 'SUSPENDED' ? 'suspended' : 'pending'
      toast.success(`User status updated to ${statusText}`)
    },
    onError: (error) => toast.error(error.message),
  })

  const { mutate: deleteLeetcoder, isPending: isDeleting } = api.leetcoders.deleteLeetcoder.useMutation({
    onSuccess: () => {
      utils.leetcoders.getAllLeetcoders.invalidate()
      toast.success('Leetcoder deleted successfully')
      setOpen(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const { mutate: updateLeetcoder, isPending: isUpdating } = api.leetcoders.updateLeetcoderAdmin.useMutation({
    onSuccess: () => {
      utils.leetcoders.getAllLeetcoders.invalidate()
      toast.success('Leetcoder updated successfully')
    },
    onError: (error) => toast.error(error.message),
  })

  const handleStatusUpdate = (newStatus: 'PENDING' | 'APPROVED' | 'SUSPENDED') => {
    updateStatus({ id: leetcoder.id, status: newStatus })
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this leetcoder? This action cannot be undone.')) {
      deleteLeetcoder({ id: leetcoder.id })
    }
  }

  const handleUpdate = () => {
    const updates: Record<string, string> = {}

    // Only include fields that have changed
    if (editedData.name !== (leetcoder.name || '')) {
      updates.name = editedData.name
    }
    if (editedData.username !== (leetcoder.username || '')) {
      updates.username = editedData.username
    }
    if (editedData.email !== (leetcoder.email || '')) {
      updates.email = editedData.email
    }
    if (editedData.lc_username !== (leetcoder.lc_username || '')) {
      updates.lc_username = editedData.lc_username
    }
    if (editedData.gh_username !== (leetcoder.gh_username || '')) {
      updates.gh_username = editedData.gh_username
    }

    // Only make the request if there are changes
    if (Object.keys(updates).length > 0) {
      updateLeetcoder({
        id: leetcoder.id,
        ...updates,
      })
    } else {
      toast.info('No changes to save')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500'
      case 'SUSPENDED':
        return 'bg-red-500'
      case 'PENDING':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Leetcoder Details
            <Badge className={getStatusColor(leetcoder.status)}>{leetcoder.status}</Badge>
          </DialogTitle>
          <DialogDescription>View and manage leetcoder information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={editedData.name}
                  onChange={(e) => setEditedData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editedData.username}
                  onChange={(e) => setEditedData((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editedData.email}
                  onChange={(e) => setEditedData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Group</Label>
                <div className="bg-muted rounded-md p-2">Group {leetcoder.group_no || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Social Profiles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Profiles</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lc_username">LeetCode Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="lc_username"
                    value={editedData.lc_username}
                    onChange={(e) => setEditedData((prev) => ({ ...prev, lc_username: e.target.value }))}
                  />
                  {editedData.lc_username && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`https://leetcode.com/${editedData.lc_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="gh_username">GitHub Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="gh_username"
                    value={editedData.gh_username}
                    onChange={(e) => setEditedData((prev) => ({ ...prev, gh_username: e.target.value }))}
                  />
                  {editedData.gh_username && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`https://github.com/${editedData.gh_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Created At</Label>
                <div className="bg-muted rounded-md p-2">{new Date(leetcoder.created_at).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Actions</h3>

            {/* Update button */}
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="mb-4 w-full"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Information
            </Button>

            {/* Status Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => handleStatusUpdate('APPROVED')}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                onClick={() => handleStatusUpdate('PENDING')}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Pending
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                onClick={() => handleStatusUpdate('SUSPENDED')}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Suspend
              </Button>
            </div>

            {/* Delete Action */}
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Leetcoder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
