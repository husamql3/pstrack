export type User = {
  id: string
  fname: string
  lname: string
  username: string
  gh_username: string
  lc_username: string
  group_id: number
}

export type Problem = {
  id: number
  p_number: number
  p_link: string
  p_topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export type Submission = {
  id: number
  user_id: string
  problem_id: number
  solved: boolean
  language: string
  solution_link: string
  created_at: string
}

export type TableRow = {
  user: User
  problem: Problem
  submissions: { [key: string]: Submission | null } // date -> submission mapping
}
