'use client'

import { useState } from 'react'
import { User } from '@supabase/auth-js'

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
import { handleInsertLeetcoder } from '@/lib/handleInsertLeetcoder'
import { TbLoader2 } from 'react-icons/tb'

const RequestToJoin = ({ user, groupId }: { user: User; groupId: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPending(true)

    const formData = new FormData(event.currentTarget)
    const success = await handleInsertLeetcoder(formData, user, groupId)

    if (success) {
      setIsPending(false)
      setIsOpen(false)
    }

    setIsPending(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
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
          <DialogTitle className="font-normal">
            Request to join <span className="font-medium">Group {groupId}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">Request to join</DialogDescription>
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
            className="space-x-2"
            disabled={isPending}
          >
            {isPending ? 'Requesting' : 'Request'}
            {isPending && <TbLoader2 className="mr-2 size-3 animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { RequestToJoin }
