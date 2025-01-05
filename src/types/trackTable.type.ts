import { GroupProgressRow, RoadmapRow, SubmissionRow } from '@/types/supabase.type'

export type TrackTableType = {
  problemOrder: number
  problem: {
    id: string
    topic: string
    difficulty: string
    link: string
    problem_no: number
  }
  totalSolved: number
  userSubmissions: {
    user_id: string
    solved: boolean
  }[]
  groupProgressDate: string | null
}

export type TableRow = {
  group_no: number
  roadmap: RoadmapRow[]
  submission: SubmissionRow[]
  group_progress: GroupProgressRow[]
}

export type TableData = {
  problemOrder: number
  problem: RoadmapRow
  totalSolved: number
  userSubmissions: SubmissionRow[]
  groupProgressDate: string | null
}[]
