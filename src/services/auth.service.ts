import { auth } from '@/db/better-auth/server'

type SignUpType = {
  email: string
  password: string
  name: string
}

export const signUp = async ({ email, password, name }: SignUpType) => {
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      metadata: {
        isFirstLogin: true,
      },
    })
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}
