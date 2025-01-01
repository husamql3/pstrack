'use client'

import { useState } from 'react'
import { IoLogoGoogle } from 'react-icons/io5'
import { TbLoader2 } from 'react-icons/tb'

import { oauthLogin } from '@/db/supabase/services/auth.service'

import { Button } from '@/components/ui/button'

const GoogleSigninButton = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    const { url, error } = await oauthLogin('google')

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
    <form action={handleGoogleLogin}>
      <Button
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading && <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />}
        <IoLogoGoogle />
        <span>Sign in with Google</span>
      </Button>
    </form>
  )
}

export default GoogleSigninButton
