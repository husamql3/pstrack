'use client'

import { useState } from 'react'
import { debounce } from 'lodash'
import { toast } from 'sonner'
import type { CellContext } from '@tanstack/react-table'
import type { leetcoders } from '@prisma/client'

import { api } from '@/trpc/react'
import type { TableRowOutput } from '@/types/tableRow.type'
import { useConfettiStore } from '@/stores/confettiStore'

import { Checkbox } from '@/app/group/_components/checkbox'

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
  const submission = info.getValue()
  const [isChecked, setIsChecked] = useState(!!submission)
  const problemId = info.row.original.problem.id
  const { triggerConfetti } = useConfettiStore()

  const { mutate: submitMutation, isPending } = api.submissions.create.useMutation()

  const handleCheckboxChange = debounce(() => {
    const newCheckedState = !isChecked
    setIsChecked(newCheckedState)

    if (newCheckedState) {
      // Store the toast ID
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
          onSuccess: () => {
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
            })

            // Trigger confetti animation
            triggerConfetti()
          },
          onError: (error) => {
            // Dismiss loading toast and show error
            toast.dismiss(loadingToastId)
            toast.error(
              error.message === 'Problem not solved'
                ? 'This problem hasn’t been solved on LeetCode yet. Please submit it there first or try again if you’ve already solved it.'
                : 'Submission failed',
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
              }
            )
            setIsChecked(false) // Uncheck on failure
          },
        }
      )
    }
  }, 300)

  return (
    <Checkbox
      checked={isChecked}
      onCheckedChange={handleCheckboxChange}
      disabled={isPending || isChecked}
      className="peer size-4 shrink-0 rounded-sm border border-zinc-200 shadow focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-zinc-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 dark:data-[state=checked]:bg-zinc-50 dark:data-[state=checked]:text-zinc-900"
    />
  )
}
