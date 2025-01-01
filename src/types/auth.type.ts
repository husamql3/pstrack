import { SignupFormData } from '@/types/schema/auth.schema'

export type SignupActionResponse = {
  success: boolean
  message: string
  errors?: {
    [K in keyof SignupFormData]?: string[]
  }
}
