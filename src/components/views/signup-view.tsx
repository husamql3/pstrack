import Link from 'next/link'

import SignUpForm from '@/components/auth/signup-from'
import { Logo } from '@/components/components/logo'

const SignupView = () => {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="flex w-full max-w-sm flex-col items-center justify-center">
        <Logo />

        <div className="flex flex-col">
          <p className="text-2xl font-semibold">Welcome to PSTrack</p>
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

        {/*<div className="after:border-border relative w-full text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">*/}
        {/*  <span className="text-muted-foreground relative z-10 bg-zinc-950 px-2">Or</span>*/}
        {/*</div>*/}

        <SignUpForm />
      </div>
    </div>
  )
}

export default SignupView
