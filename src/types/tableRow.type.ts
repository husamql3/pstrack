import type { group_progress, leetcoders, roadmap, submissions } from '@prisma/client'

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

export type GroupData = {
  id: string
  group_no: number
  leetcoders: leetcoders[]
  group_progress: group_progress[]
  submissions: submissions[]
}
