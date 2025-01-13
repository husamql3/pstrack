import { leetcoders } from '@prisma/client'

import { TableRowOutput } from '@/types/tableRow.type'
import { SubmitDailyProblem } from '@/types/submitDailyProblem.type'

export type TrackTableProps = {
  tableData: TableRowOutput[]
  leetcoders: leetcoders[]
  userId?: string
  onSubmit: ({
    user_id,
    problem_slug,
    problem_id,
    group_no,
    lc_username,
  }: SubmitDailyProblem) => Promise<boolean>
  groupId: number
}
