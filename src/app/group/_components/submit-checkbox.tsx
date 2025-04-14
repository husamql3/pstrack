import type { CellContext } from '@tanstack/react-table'
import type { leetcoders } from '@prisma/client'

import type { TableRowOutput } from '@/types/tableRow.type'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'
import { api } from '@/trpc/react'

type SubmissionCheckboxProps = {
  info: CellContext<TableRowOutput, unknown>
  leetcoder: leetcoders
  groupId: string
}

export const SubmitCheckbox = ({ info, leetcoder, groupId }: SubmissionCheckboxProps) => {
  const submission = info.getValue()
  const [isChecked, setIsChecked] = useState(!!submission)
  const problemId = info.row.original.problem.id
  const group_no = info.row.original

  const submitMutation = api.submissions.create.useMutation({
    onError: (error) => {},
    onSuccess: () => {},
  })

  const handleCheckboxChange = () => {
    const newCheckedState = !isChecked
    setIsChecked(newCheckedState)

    if (newCheckedState) {
      submitMutation.mutate({
        userId: leetcoder.id,
        problemId: problemId,
        group_no: groupId,
      })
    }
    // Note: You might want to add a delete mutation for unchecking
  }

  return (
    <Checkbox
      checked={isChecked}
      onCheckedChange={handleCheckboxChange}
      // checked={isChecked}
      // className="rounded-[.3rem] disabled:opacity-100 dark:data-[state=checked]:bg-[#2383E2]"
    />
  )
}
