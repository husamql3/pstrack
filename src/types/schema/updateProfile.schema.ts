import { z } from 'zod'

export const UpdateProfileSchema = z.object({
  // id: z.string(),
  // username: z.string(),
  // group_no: z.number(),
  name: z.string().min(2, {
    message: 'Name is required and must be at least 2 characters',
  }),
  lc_username: z.string(),
  gh_username: z.string().optional(),
  x_username: z.string().optional(),
  li_username: z.string().optional(),
})

export type TUpdateProfileSchema = z.infer<typeof UpdateProfileSchema>
