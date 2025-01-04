'use client'

import { useState } from 'react'
import { TbLoader2 } from 'react-icons/tb'
import { LuGithub } from 'react-icons/lu'

import { oauthLogin } from '@/db/supabase/services/auth.service'

import { Button } from '@/components/ui/button'

const GithubSigninButton = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleGithubLogin = async () => {
    setIsLoading(true)

    const { url, error } = await oauthLogin('github')

    if (error) {
      console.error('Signin error:', error)
      setIsLoading(false)
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
        disabled={isLoading}
      >
        {isLoading && <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />}
        <LuGithub />
        <span>Sign in with GitHub</span>
      </Button>
    </form>
  )
}

export { GithubSigninButton }
