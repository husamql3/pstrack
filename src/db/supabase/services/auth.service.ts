'use server'

import { createClient } from '@/db/supabase/server'
import { SigninSchema, signUpSchema } from '@/types/schema/auth.schema'
import { ActionResponse } from '@/types/auth.type'

export const signUp = async (
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> => {
  try {
    const rawData = {
      email: String(formData.get('email')).trim().toLowerCase(),
      password: String(formData.get('password')),
    }

    const result = signUpSchema.safeParse(rawData)

    if (!result.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email: rawData.email,
      password: rawData.password,
    })

    if (error) {
      console.error('Signup error:', error)
      switch (error.status) {
        case 400:
          return {
            success: false,
            message: 'Invalid email or password format',
          }
        case 422:
          return { success: false, message: 'Email already registered' }
        case 429:
          return {
            success: false,
            message: 'Too many attempts. Please try again later',
          }
        default:
          return { success: false, message: 'Something went wrong' }
      }
    }

    return {
      success: true,
      message: 'Signup successful',
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    }
  }
}

export const signIn = async (prevState: ActionResponse | null, formData: FormData) => {
  try {
    const rawData = {
      email: String(formData.get('email')).trim().toLowerCase(),
      password: String(formData.get('password')),
    }

    const result = SigninSchema.safeParse(rawData)

    if (!result.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: rawData.email,
      password: rawData.password,
    })

    if (error) {
      console.error('Signin error:', error)
      switch (error.status) {
        case 400:
          return {
            success: false,
            message: 'Invalid email or password format',
          }
        case 401:
          return {
            success: false,
            message: 'Incorrect email or password',
          }
        case 429:
          return {
            success: false,
            message: 'Too many attempts. Please try again later',
          }
        default:
          return {
            success: false,
            message: 'Something went wrong. Please try again later.',
          }
      }
    }

    return {
      success: true,
      message: 'Login successful',
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    }
  }
}

export const logout = async () => {
  const supabase = await createClient()

  try {
    await supabase.auth.signOut()
    return {
      success: true,
      message: 'Logout successful',
    }
  } catch (error) {
    console.error('Signout error:', error)
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    }
  }
}
