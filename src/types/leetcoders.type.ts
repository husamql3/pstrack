import type { submissions } from '@prisma/client'
import { z } from 'zod'

export type LeetcoderWithSubmissions = {
  id: string
  group_no: number
  created_at: Date
  email: string
  is_notified: boolean
  submissions: Pick<submissions, 'problem_id'>[]
}

export const updateLeetcoderSchema = z.object({
  id: z.string(),
  gh_username: z.string().optional(),
  x_username: z.string().optional(),
  li_username: z.string().optional(),
  group_no: z
    .string()
    .transform((val) => Number(val))
    .optional(),
  website: z.string().optional(),
  is_visible: z.boolean().optional(),
})

export type UpdateLeetcoderInput = z.infer<typeof updateLeetcoderSchema>
