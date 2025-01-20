import { group_progress, roadmap, submissions } from '@prisma/client'

export type TableRow = {
  group_no: number
  roadmap: roadmap[]
  submission: submissions[]
  group_progress: group_progress[]
}

export type TableRowOutput = {
  problemOrder: number
  problem: roadmap
  totalSolved: number
  totalSubmissions: number
  userSubmissions: submissions[]
  groupProgressDate: string | null
}

export type TableData = TableRowOutput[]
