'use client'

import { useState } from 'react'
import { ZodError } from 'zod'
import { User } from '@supabase/auth-js'

import { fetcher } from '@/lib/fetcher'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const RequestToJoin = ({ user, groupId }: { user: User; groupId: string }) => {
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get('name'),
      username: formData.get('username'),
      email: user.email,
      group_no: groupId,
      user_id: user.id,
      gh_username: formData.get('gh_username') || '',
      lc_username: formData.get('lc_username') || '',
      status: 'pending',
    }

    try {
      await fetcher('/api/request', 'POST', data)
      toast({
        title: 'Request submitted!',
        description:
          'Your request is under review. You will be notified once it is approved.',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error submitting request:', error)

      if (error instanceof ZodError) {
        toast({
          title: 'Validation Error',
          description: error.errors.map((err) => err.message).join(', '),
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Submission failed',
          description:
            error instanceof Error
              ? error.message
              : 'An error occurred while submitting your request.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button
          size="sm"
          variant="ghost"
          className="px-3"
        >
          Request to join
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-medium">
            Request to join{' '}
            <span className="font-semibold">Group {groupId}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Make changes to your profile here. Click save when you&#39;re done.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 py-4"
          id="request-to-join-form"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              Name <span className="text-sm text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={user?.user_metadata?.full_name || ''}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">
              Username <span className="text-sm text-red-500">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              defaultValue={user?.user_metadata?.username || ''}
              placeholder="Enter your username (will be visible to the table)"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="gh_username">GitHub Username</Label>
            <Input
              id="gh_username"
              name="gh_username"
              placeholder="Enter your GitHub username"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lc_username">LeetCode Username</Label>
            <Input
              id="lc_username"
              name="lc_username"
              placeholder="Enter your Leetcode username"
            />
          </div>

          <input
            hidden
            name="id"
            value={user?.id}
            type="text"
          />
          <input
            hidden
            name="groupId"
            value={groupId}
            type="text"
          />
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="request-to-join-form"
            disabled={isPending}
          >
            {isPending ? 'Requesting...' : 'Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { RequestToJoin }
