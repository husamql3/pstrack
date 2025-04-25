'use client'

import { MdFeedback } from 'react-icons/md'
import { MailIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { z } from 'zod'

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
import { Input } from '@/ui/input'
import { Textarea } from '@/ui/textarea'

export const FeedbackDialog = ({ email: defaultEmail = '' }: { email?: string }) => {
  const [email, setEmail] = useState(defaultEmail)
  const [feedback, setFeedback] = useState('')
  const [open, setOpen] = useState(false)

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
      })
    },
  })
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const emailSchema = z.string().email()
      emailSchema.parse(email)

      sendEmail({
        context: {
          email: email,
          subject: 'Feedback from PSTrack User',
          message: feedback,
        },
      })
    } catch {
      toast.error('Invalid email', {
        description: 'Please enter a valid email address.',
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        className="fixed right-5 bottom-5 sm:right-10 sm:bottom-10"
        asChild
      >
        <Button size="icon">
          <MdFeedback />
        </Button>
      </DialogTrigger>
      <DialogContent className="z-[110]">
        <DialogHeader>
          <DialogTitle className="mb-2">Share Your Thoughts</DialogTitle>
          <DialogDescription>
            We value your input! Help us enhance PSTrack by sharing your experience and suggestions
            for improvement.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={handleSubmit}
        >
          <div className="space-y-3">
            <div className="relative">
              <Input
                id="dialog-subscribe"
                className="peer ps-9"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                aria-label="Email"
                required
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                <MailIcon
                  size={16}
                  aria-hidden="true"
                />
              </div>
            </div>
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
