import { z } from 'zod'

export const AddNewResourceSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  url: z.string().url({ message: 'Must be a valid URL' }),
  type: z
    .number()
    .int()
    .positive({ message: 'Type ID must be a positive integer' })
    .transform((val) => Number(val)),
  tab: z
    .number()
    .int()
    .positive({ message: 'Tab ID must be a positive integer' })
    .transform((val) => Number(val)),
  contributor: z.string().optional(),
  topic: z.string().min(1, { message: 'Topic is required' }),
})

export type AddNewResourceSchemaType = z.infer<typeof AddNewResourceSchema>
