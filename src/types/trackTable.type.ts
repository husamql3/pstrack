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
