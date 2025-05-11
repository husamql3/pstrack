import type { leetcoders, roadmap } from '@prisma/client'

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
