export type SendEmail = {
  to: string
  username: string
  group_no: string
}

export type SendDailyProblemEmail = {
  problem_slug: string
  difficulty: string
  topic: string
  group_no: string
  email: string
}
