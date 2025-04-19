'use client'

import { useState } from 'react'
import { debounce } from 'lodash'
import { toast } from 'sonner'
import type { CellContext } from '@tanstack/react-table'
import type { leetcoders } from '@prisma/client'

import { api } from '@/trpc/react'
import type { TableRowOutput } from '@/types/tableRow.type'
import { useConfettiStore } from '@/stores/confettiStore'
import { useSubmissionStore } from '@/stores/submissionStore'

import { Checkbox } from '@/app/group/_components/checkbox'

export const SubmitCheckbox = ({
  info,
  leetcoder,
  groupId,
  problemSlug,
  onSuccessfulSubmit,
}: {
  info: CellContext<TableRowOutput, unknown>
  leetcoder: leetcoders
  groupId: string
  problemSlug: string
  onSuccessfulSubmit: () => void
}) => {
  // Get the submission from the table data
  const submission = info.getValue()
  const problemId = info.row.original.problem.id

  // Create a unique submission key for the store
  const submissionKey = `${groupId}:${leetcoder.id}:${problemId}`

  // Get submission state and setter from the Zustand store
  const { isSubmitted, setSubmission } = useSubmissionStore()

  // Check both the API data and the store for submission state
  const [isChecked, setIsChecked] = useState(() => {
    return isSubmitted(submissionKey) || !!submission
  })

  const { triggerConfetti } = useConfettiStore()

  const { mutate: submitMutation, isPending } = api.submissions.create.useMutation()
  const { data: user } = api.auth.getUser.useQuery()
  const isCurrUser = user?.id === leetcoder.id

  const { mutate: sendEmail } = api.admin.sendEmail.useMutation()

  const handleCheckboxChange = debounce(() => {
    // If already checked, do nothing
    if (isChecked) return

    // Optimistically update the UI
    setIsChecked(true)

    // Show loading toast
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

    submitMutation(
      {
        userId: leetcoder.id,
        problemId: problemId,
        group_no: groupId,
        lcUsername: leetcoder.lc_username,
        problemSlug: problemSlug,
      },
      {
        onSuccess: async () => {
          // Dismiss loading toast and show success
          toast.dismiss(loadingToastId)
          toast.success('Submission successful!', {
            style: {
              background: '#4CAF50',
              color: 'white',
              borderRadius: '8px',
              padding: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: 'none',
            },
            closeButton: true,
          })

          // Trigger confetti animation
          triggerConfetti()

          // Ensure it stays checked and save to the store
          setIsChecked(true)
          setSubmission(submissionKey, true)

          // Invalidate the Redis cache
          try {
            await fetch('/api/invalidate-cache', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ groupId }),
            })
          } catch (error) {
            console.error('Failed to invalidate cache:', error)
          }

          // Call the callback to resort leetcoders
          onSuccessfulSubmit()
        },
        onError: async (error) => {
          // Dismiss loading toast and show error
          toast.dismiss(loadingToastId)

          const errorMsg =
            error.message === 'Problem not solved'
              ? "This problem hasn't been solved on LeetCode yet. Please submit it there first or try again if you've already solved it."
              : 'Submission failed'

          toast.error(errorMsg, {
            style: {
              background: '#F44336',
              color: 'white',
              borderRadius: '8px',
              padding: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: 'none',
            },
            duration: 5000,
            closeButton: true,
          })

          // Send admin notification about the error
          try {
            sendEmail({
              context: {
                errorType: 'submitCheckbox',
                errorMessage: errorMsg,
                username: leetcoder.lc_username || 'unknown',
                timestamp: new Date().toISOString(),
              },
            })
          } catch (notificationError) {
            console.error('Failed to send admin notification:', notificationError)
          }

          // Reset the checked state on error
          setIsChecked(!!submission)
          setSubmission(submissionKey, false)
        },
      }
    )
  }, 300)

  return (
    <Checkbox
      checked={isChecked}
      onCheckedChange={handleCheckboxChange}
      disabled={isPending || isChecked || !user || !isCurrUser}
      className="peer size-4 shrink-0 rounded-sm border border-zinc-200 shadow focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-zinc-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 dark:data-[state=checked]:bg-zinc-50 dark:data-[state=checked]:text-zinc-900"
    />
  )
}
