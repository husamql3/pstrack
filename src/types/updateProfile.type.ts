import { TUpdateProfileSchema } from '@/types/schema/updateProfile.schema'

export type ActionResponse = {
  success: boolean
  message: string
  errors?: {
    [K in keyof TUpdateProfileSchema]?: string[]
  }
}
