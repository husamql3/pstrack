import { z } from 'zod'

export const AddNewResourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Must be a valid URL'),
  type: z.number().int().positive('Type ID must be a positive integer'),
  tab: z.number().int().positive('Tab ID must be a positive integer'),
  contributor: z.string().min(1, 'Contributor is required'),
  topic: z.string().min(1, 'Topic is required'),
  is_visible: z.boolean().default(false),
  is_approved: z.boolean().default(false),
})

export type AddNewResourceSchemaType = z.infer<typeof AddNewResourceSchema>
