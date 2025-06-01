import { z } from 'zod'

export const AddNewResourceSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  url: z.string().url({ message: 'Must be a valid URL' }),
  type: z.string().min(1, { message: 'Resource type is required' }),
  tab: z.string().min(1, { message: 'Resource category is required' }),
  contributor: z.string().optional(),
  topic: z.string().min(1, { message: 'Topic is required' }),
})

export type AddNewResourceSchemaType = z.infer<typeof AddNewResourceSchema>
