import type { submissions, leetcoders, groups, roadmap } from '@prisma/client'

export type LeetcoderWithSubmissions = {
  id: string
  group_no: number
  created_at: Date
  email: string
  is_notified: boolean
  submissions: Pick<submissions, 'problem_id'>[]
}

// Definition for LeetcoderWithProblem
export type LeetcoderWithProblem = leetcoders & {
  group: groups;
  problemDetails: Pick<roadmap, 'problem_slug' | 'difficulty' | 'topic'>;
};
