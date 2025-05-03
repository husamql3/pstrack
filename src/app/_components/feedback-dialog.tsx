'use client'

import { MdFeedback } from 'react-icons/md'
import { toast } from 'sonner'
import { useState } from 'react'

import { api } from '@/trpc/react'

import { Button } from '@/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import { Textarea } from '@/ui/textarea'
import { errorToastStyle } from './toast-styles'

export const FeedbackDialog = () => {
  const [feedback, setFeedback] = useState('')
  const [open, setOpen] = useState(false)

  const { data: user } = api.auth.getUser.useQuery()
  const { mutate: sendEmail, isPending } = api.email.sendEmail.useMutation({
    onSuccess: () => {
      toast.success('Feedback sent!', {
        description: 'Thank you for your feedback.',
      })
      setFeedback('')
      setOpen(false)
    },
    onError: (error) => {
      toast.error('Failed to send feedback', {
        description: error.message || 'Please try again later.',
        style: errorToastStyle,
      })
    },
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.email) {
      toast.error('User email not found', {
        description: 'Please ensure you are logged in.',
      })
      return
    }

    sendEmail({
      context: {
        email: user.email,
        subject: 'Feedback from PSTrack User',
        message: feedback,
      },
    })

    // Reset feedback even if the request is still pending
    setFeedback('')
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        className="fixed right-5 bottom-5 z-[100] sm:right-10 sm:bottom-10"
        asChild
      >
        <Button
          size="icon"
          className="border border-zinc-900"
        >
          <MdFeedback />
        </Button>
      </DialogTrigger>
      <DialogContent className="z-[110]">
        <DialogHeader>
          <DialogTitle className="mb-2">Share Your Thoughts</DialogTitle>
          <DialogDescription>
            We value your input! Help us enhance PSTrack by sharing your experience and suggestions
            for improvement. You can also{' '}
            <a
              href="https://github.com/husamahmud/pstrack/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              open an issue on GitHub
            </a>
            .
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-3">
            <Textarea
              id="feedback"
              placeholder="What would you like to see improved in PSTrack?"
              aria-label="Send feedback"
              className="border-[1px]"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end">
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Sending...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
