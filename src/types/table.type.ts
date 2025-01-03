export type LeetCoder = {
  id: string
  name: string
  username: string
  ghUsername: string
  lcUsername: string
  groupId: number
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type Problem = {
  id: number
  pNumber: number
  pLink: string
  pTopic: string
  difficulty: Difficulty
}

export type Submission = {
  id: number
  createdAt: string
  userId: string
  pId: number
  solved: boolean
  language: string
  solutionLink: string
}

export type TableRow = {
  user: LeetCoder
  problem: Problem
  submissions: { [key: string]: Submission | null }
}
