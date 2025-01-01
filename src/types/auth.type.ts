import { SignupFormData } from '@/types/schema/auth.schema'

export type ActionResponse = {
  success: boolean
  message: string
  errors?: {
    [K in keyof SignupFormData]?: string[]
  }
}
