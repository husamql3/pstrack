'use server'

import { z } from 'zod'

export type ActionResponse = {
  success: boolean
  message: string
  errors?: {
    [K in keyof SignupFormData]?: string[]
  }
}

type SignupFormData = z.infer<typeof signUpSchema>

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const signUp = async (
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const rawData: SignupFormData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const parsedData = signUpSchema.safeParse(rawData)

    if (!parsedData.success) {
      console.log('parsedData.error', parsedData.error)
      return {
        success: false,
        message: 'Please fix the errors in the form',
        errors: parsedData.error.flatten().fieldErrors,
      }
    }

    console.log('Sign up successful!', parsedData.data)
    return {
      success: true,
      message: 'Sign up successful!',
    }
  } catch (error) {
    console.error('An unexpected error occurred', error)
    return {
      success: false,
      message: 'An unexpected error occurred',
    }
  }
}
