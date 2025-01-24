import { z } from 'zod'

export const RequestInsertSchema = z.object({
  email: z.string().email(),
  gh_username: z.string().nullable().optional(),
  group_no: z.number().nullable().optional(),
  lc_username: z.string().nullable().optional(),
  name: z.string().min(1, { message: 'Name is required' }),
  status: z.enum(['PENDING', 'APPROVED']),
  user_id: z.string().uuid().nullable().optional(),
  username: z
    .string()
    .min(1, { message: 'Username is required' })
    .max(12, {
      message: 'Username must be less than 10 characters',
    })
    .refine(
      (value) => !/\s/.test(value), // Check for spaces
      { message: 'Username must not contain spaces' }
    )
    .refine(
      (value) => value === value.toLowerCase(), // Check for lowercase
      { message: 'Username must be in lowercase' }
    ),
})
