export type SendApprovalEmail = {
  to: string
  username: string
  group_no: string
}

export type SendEmailType = {
  to: string
  subject: string
  html: string
}

export type SendAdminEmailType = {
  error?: unknown
  progress?: string
  context: string
}

export type SendDailyProblemEmail = {
  problem_slug: string
  difficulty: string
  topic: string
  group_no: string
  email: string
}

export type SendRemiderEmail = {
  group_no: string
  to: string
}
