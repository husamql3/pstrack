import type { submissions } from '@prisma/client'

export type LeetcoderWithSubmissions = {
  id: string
  group_no: number
  created_at: Date
  email: string
  is_notified: boolean
  submissions: Pick<submissions, 'problem_id'>[]
}
