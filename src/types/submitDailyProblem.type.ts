export type SubmitDailyProblem = {
  user_id: string
  problem_slug: string
  lc_username: string
  group_no: number
  problem_id: string
}

export type UseSubmitDailyProblemReturn = {
  submitDailyProblem: ({
    user_id,
    problem_slug,
    lc_username,
    problem_id,
    group_no,
  }: SubmitDailyProblem) => Promise<boolean>
}
