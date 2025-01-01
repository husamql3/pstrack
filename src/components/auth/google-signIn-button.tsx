'use client'

import { IoLogoGoogle } from 'react-icons/io5'

import { oauthLogin } from '@/db/supabase/services/auth.service'

import { Button } from '@/components/ui/button'

const GoogleSigninButton = () => {
  const handleGoogleLogin = async () => {
    const { url, error } = await oauthLogin('google')

    if (error) {
      console.error('Signin error:', error)
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
      >
        <IoLogoGoogle />
        <span>Sign in with Google</span>
      </Button>
    </form>
  )
}

export default GoogleSigninButton
