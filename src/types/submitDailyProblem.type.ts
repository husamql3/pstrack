export type SubmitDailyProblem = {
  user_id: string
  problem_id: string
  group_no: number
}

export type UseSubmitDailyProblemReturn = {
  submitDailyProblem: ({
    user_id,
    problem_id,
    group_no,
  }: SubmitDailyProblem) => Promise<boolean>
}
