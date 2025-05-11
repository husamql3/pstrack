import type { group_progress, groups, leetcoders, roadmap, submissions } from '@prisma/client'

export type GetAllGroupsInfoType = {
  id: string
  group_no: number
  leetcoders: Pick<leetcoders, 'id' | 'name' | 'avatar'>[]
  group_progress: {
    id: string
    created_at: Date
    group_no: number
    current_problem: number
    roadmap: Pick<roadmap, 'topic' | 'problem_order'>
  }[]
}

export type GroupTableDataType =
  | (groups & {
      leetcoders: leetcoders[]
      group_progress: group_progress[]
      submissions: (submissions & {
        problem: roadmap
        user: leetcoders
      })[]
    })
  | null
