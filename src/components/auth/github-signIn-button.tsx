'use client'

import { LuGithub } from 'react-icons/lu'

import { oauthLogin } from '@/db/supabase/services/auth.service'

import { Button } from '@/components/ui/button'

const GithubSigninButton = () => {
  const handleGithubLogin = async () => {
    const { url, error } = await oauthLogin('github')

    if (error) {
      console.error('Signin error:', error)
      return
    }

    if (url) {
      window.location.href = url
    }
  }

  return (
    <form action={handleGithubLogin}>
      <Button
        variant="outline"
        className="w-full"
      >
        <LuGithub />
        <span>Sign in with GitHub</span>
      </Button>
    </form>
  )
}

export default GithubSigninButton
