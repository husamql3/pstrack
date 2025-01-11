import Link from 'next/link'

import SignUpForm from '@/components/auth/signup-from'
import { Logo } from '@/components/components/logo'

const SignupView = () => {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="flex w-full max-w-sm flex-col items-center justify-center gap-4">
        <Logo className="size-20" />

        <p className="text-2xl font-semibold">Welcome to PSTrack</p>

        <SignUpForm />

        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link
            className="underline underline-offset-4"
            href="/login"
            prefetch
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupView
