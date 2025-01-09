import Link from 'next/link'

import { Logo } from '@/components/components/logo'
import { SignInForm } from '@/components/auth/signin-form'
import { GoogleSigninButton } from '@/components/auth/google-signIn-button'
import { GithubSigninButton } from '@/components/auth/github-signIn-button'

const SigninView = () => {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="flex w-full max-w-sm flex-col items-center justify-center gap-4">
        <Logo className="size-20" />

        <p className="text-2xl font-semibold">Welcome back to PSTrack</p>

        <div className="w-full space-y-3">
          <GithubSigninButton />
          <GoogleSigninButton />
        </div>

        <div className="w-full">
          <div className="after:border-border relative w-full text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="relative z-10 bg-zinc-950 px-2 text-zinc-200">Or</span>
          </div>

          <SignInForm />
        </div>

        <p className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="underline underline-offset-4"
            prefetch
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SigninView
