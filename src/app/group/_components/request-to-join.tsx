'use client'

import { ArrowRightIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { cn } from '@/utils/cn'
import { api } from '@/trpc/react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { AnimatedShinyText } from '@/ui/animated-shiny-text'
import { Label } from '@/ui/label'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'

type FormDataType = {
  name: string
  username: string
  lc_username: string
  gh_username: string
}

export const RequestToJoin = ({ groupId }: { groupId: string }) => {
  const router = useRouter()

  const { mutate: requestToJoin, isPending } = api.leetcoders.RequestToJoin.useMutation()
  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    username: '',
    lc_username: '',
    gh_username: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('formData')

    const loadingToastId = toast.loading('Checking, Hold a second', {
      style: {
        background: 'white',
        color: 'black',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: 'none',
      },
      closeButton: true,
    })

    requestToJoin(
      {
        name: formData.name,
        username: formData.username,
        lc_username: formData.lc_username,
        gh_username: formData.gh_username,
        group_no: groupId,
      },
      {
        onSuccess: () => {
          router.refresh()

          toast.dismiss(loadingToastId)
          toast.success(
            `Awesome! Your request to join Group ${groupId.padStart(2, '0')} has been received. We'll notify you once you're accepted!`
          )
        },
        onError: (e) => {
          console.error('Mutation error:', e)
          toast.dismiss(loadingToastId)
          toast.error(
            e.message || 'Oops, something went wrong. Please check your details and try again!',
            {
              style: {
                background: '#F44336',
                color: 'white',
                borderRadius: '8px',
                padding: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: 'none',
              },
              duration: 5000, // 5 seconds duration to make sure the user sees the error message
              closeButton: true,
            }
          )
        },
      }
    )
  }

  // todo: add https://www.luxeui.com/ui/multi-step-modal for rules and guidelines

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="z-10 flex items-center justify-center">
          <div
            className={cn(
              'group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800'
            )}
          >
            <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
              <span>✨ Request to join</span>
              <ArrowRightIcon className="ml-1 size-4 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
            </AnimatedShinyText>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-normal">
            Request to join <span className="font-semibold">Group {groupId.padStart(2, '0')}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">Request to join</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleRequest}
          id="request-to-join-form"
          className="grid gap-4 py-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">
              Name<span className="text-sm text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
              required
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">
              Username<span className="text-sm text-red-500">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username (will be visible to the table)"
              required
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lc_username">
              LeetCode Username<span className="text-sm text-red-500">*</span>
            </Label>
            <Input
              id="lc_username"
              name="lc_username"
              value={formData.lc_username}
              onChange={handleInputChange}
              placeholder="Enter your Leetcode username"
              required
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="gh_username">GitHub Username</Label>
            <Input
              id="gh_username"
              name="gh_username"
              value={formData.gh_username}
              onChange={handleInputChange}
              placeholder="Enter your GitHub username"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              type="submit"
              form="request-to-join-form"
              className="space-x-2"
              disabled={isPending}
            >
              {isPending ? 'Requesting' : 'Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
