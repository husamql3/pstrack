export type GetAllGroupsInfo = {
  id: string
  group_no: number
  leetcoders: { id: string; name: string; avatar: string | null }[]
  group_progress: {
    id: string
    created_at: Date
    group_no: number
    current_problem: number
    roadmap: { problem_order: number; topic: string }
  }[]
}

export type GroupCardProps = {
  group: GetAllGroupsInfo
  problemsCount: number
  userGroup: number | undefined
}
