'use client'

import type { leetcoders } from '@prisma/client'
import type { CellContext } from '@tanstack/react-table'
import { debounce } from 'lodash'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { errorToastStyle, loadingToastStyle, successToastStyle } from '@/app/_components/toast-styles'
import { Checkbox } from '@/app/group/_components/checkbox'
import { useConfettiStore } from '@/stores/confettiStore'
import { api } from '@/trpc/react'
import type { TableRowOutput } from '@/types/tableRow.type'

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
  const utils = api.useUtils()

  // Get the submission from the table data
  const submission = info.getValue()
  const problemId = info.row.original.problem.id

  // Use server data as the single source of truth
  const [isChecked, setIsChecked] = useState(() => !!submission)

  const { triggerConfetti } = useConfettiStore()

  const { mutate: submitMutation, isPending } = api.submissions.create.useMutation()

  const { data: user } = api.auth.getUser.useQuery()
  const isCurrUser = user?.id === leetcoder.id

  // Update local state when server data changes
  useEffect(() => {
    setIsChecked(!!submission)
  }, [submission])

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
          toast.dismiss(loadingToastId)
          triggerConfetti()

          // Invalidate and refetch the group data to get updated submissions
          await utils.groups.getGroupTableData.invalidate({ group_no: groupId })

          // Show success toast
          toast.success('Submission successful!', {
            style: successToastStyle,
            closeButton: true,
          })

          // Refresh the page to re-sort the table with updated data
          router.refresh()
        },
        onError: (error) => {
          // Reset the checked state to match server data
          setIsChecked(!!submission)

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
