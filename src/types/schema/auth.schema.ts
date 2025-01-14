import { z } from 'zod'

export const SignUpSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[0-9]/, 'At least 1 number')
    .regex(/[a-z]/, 'At least 1 lowercase letter')
    .regex(/[A-Z]/, 'At least 1 uppercase letter'),
})

export type SignupFormData = z.infer<typeof SignUpSchema>

export const SigninSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(8, 'At least 8 characters'),
})

export type SigninFormData = z.infer<typeof SigninSchema>
