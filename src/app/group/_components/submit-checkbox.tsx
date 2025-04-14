'use client'

import type { CellContext } from '@tanstack/react-table'
import type { leetcoders } from '@prisma/client'
import { toast } from 'sonner'

import { Checkbox } from '@/app/group/_components/checkbox'

import type { TableRowOutput } from '@/types/tableRow.type'
import { useState } from 'react'
import { api } from '@/trpc/react'

export const SubmitCheckbox = ({
  info,
  leetcoder,
  groupId,
}: {
  info: CellContext<TableRowOutput, unknown>
  leetcoder: leetcoders
  groupId: string
}) => {
  const submission = info.getValue()
  const [isChecked, setIsChecked] = useState(!!submission)
  const problemId = info.row.original.problem.id

  const { mutate: submitMutation, isPending } = api.submissions.create.useMutation({
    onError: (error) => {},
    onSuccess: () => {
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
    },
  })

  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked
    setIsChecked(newCheckedState)
    if (newCheckedState) {
      submitMutation({
        userId: leetcoder.id,
        problemId: problemId,
        group_no: groupId,
      })
    }
  }

  return (
    <Checkbox
      checked={isChecked}
      onCheckedChange={handleCheckboxChange}
      disabled={isPending || isChecked}
      className="peer size-4 shrink-0 rounded-sm border border-zinc-200 shadow focus-visible:ring-1 focus-visible:ring-zinc-950 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-zinc-900 data-[state=checked]:text-zinc-50 dark:border-zinc-800 dark:focus-visible:ring-zinc-300 dark:data-[state=checked]:bg-zinc-50 dark:data-[state=checked]:text-zinc-900"
    />
  )
}
