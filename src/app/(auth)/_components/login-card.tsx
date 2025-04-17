'use client'

import type { Provider } from '@supabase/supabase-js'
import { IoLogoGithub, IoLogoGoogle } from 'react-icons/io5'
import { toast } from 'sonner'

import { signIn } from '@/supabase/auth.service'

import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// add animated card border: https://www.luxeui.com/ui/card-animated-border

export const LoginCard = () => {
  const handleSignIn = async (provider: Provider) => {
    const toastId = toast.loading('Redirecting to login...')
    const { error } = await signIn(provider)
    if (error) {
      toast.error('Login failed, please try again.', { id: toastId })
      console.error(error)
      return
    }
  }

  return (
    <Card className="w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome to PSTrack</CardTitle>
        <CardDescription>Login with your GitHub or Google account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSignIn('github')}
            >
              <IoLogoGithub size={16} />
              Login with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSignIn('google')}
            >
              <IoLogoGoogle size={16} />
              Login with Google
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
