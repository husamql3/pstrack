export type RecentSubmission = {
  title: string
  titleSlug: string
  status: number
  lang: string
  timestamp: string
}

export type ValidateDailyProblemSolved = {
  lc_username: string
  problem_slug: string
}
