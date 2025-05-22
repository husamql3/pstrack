'use client'

import { useState } from 'react'
import { debounce } from 'lodash'
import { toast } from 'sonner'
import type { CellContext } from '@tanstack/react-table'
import type { leetcoders } from '@prisma/client'
import { useRouter } from 'next/navigation'

import { api } from '@/trpc/react'
import type { TableRowOutput } from '@/types/tableRow.type'
import { useConfettiStore } from '@/stores/confettiStore'
import { useSubmissionStore } from '@/stores/submissionStore'

import { Checkbox } from '@/app/group/_components/checkbox'
import { errorToastStyle, loadingToastStyle, successToastStyle } from '@/app/_components/toast-styles'

export const SubmitCheckbox = ({
  info,
  leetcoder,
  groupId,
  problemSlug,
}: {
  info: CellContext<TableRowOutput, unknown>
  leetcoder: leetcoders
  groupId: string
  problemSlug: string
}) => {
  const router = useRouter()

  // Get the submission from the table data
  const submission = info.getValue()
  const problemId = info.row.original.problem.id

  // Create a unique submission key for the store
  const submissionKey = `${leetcoder.id}:${leetcoder.group_no}:${problemId}`

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

  const handleCheckboxChange = debounce(() => {
    // If already checked, do nothing
    if (isChecked) return

    // Optimistically update the UI
    setIsChecked(true)

    // Show loading toast
    const loadingToastId = toast.loading('Verifying your solution...', {
      style: loadingToastStyle,
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
            style: successToastStyle,
            closeButton: true,
          })

          // Trigger confetti animation
          triggerConfetti()

          // Ensure it stays checked and save to the store
          setIsChecked(true)
          setSubmission(submissionKey, true)

          // Refresh the page to re-sort the table
          router.refresh()
        },
        onError: async (error) => {
          // Dismiss loading toast and show error
          toast.dismiss(loadingToastId)

          const errorMsg =
            error.message === 'Problem not solved'
              ? 'Problem not found on your LeetCode submissions. Solve it there first or try again.'
              : 'Submission failed. Please try again.'

          toast.error(errorMsg, {
            style: errorToastStyle,
            duration: 5000,
            closeButton: true,
          })

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
      className="peer size-4 shrink-0 rounded-sm border border-zinc-200 shadow focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-400 dark:focus-visible:ring-zinc-300"
    />
  )
}
