'use client'

import { User } from '@supabase/auth-js'
import { useActionState } from 'react'
import { requestGroup } from '@/db/supabase/services/group.service'

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
  const [state, action, isPending] = useActionState(requestGroup, {
    success: false,
    message: '',
  })

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
          action={action}
          className="grid gap-4 py-4"
          id="request-to-join-form" // Add an ID to the form
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
            <Label htmlFor="ghUsername">GitHub Username</Label>
            <Input
              id="ghUsername"
              name="ghUsername"
              placeholder="Enter your GitHub username"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lcUsername">LeetCode Username</Label>
            <Input
              id="lcUsername"
              name="lcUsername"
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
