'use client'

import type { CellContext } from '@tanstack/react-table'
import type { leetcoders } from '@prisma/client'

import type { TableRowOutput } from '@/types/tableRow.type'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import { api } from '@/trpc/react'
import { toast } from 'sonner'

type SubmissionCheckboxProps = {
  info: CellContext<TableRowOutput, unknown>
  leetcoder: leetcoders
  groupId: string
}

export const SubmitCheckbox = ({ info, leetcoder, groupId }: SubmissionCheckboxProps) => {
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
    />
  )
}
