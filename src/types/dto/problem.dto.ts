import { z } from 'zod'

export const CreateProblemDto = z.object({
  id: z.number(),
  pNumber: z.number().min(1),
  pLink: z.string().url(),
  pTopic: z.string().min(1),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
})

export type CreateProblemInput = z.infer<typeof CreateProblemDto>
