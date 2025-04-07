'use client'

import { IoLogoGithub, IoLogoGoogle } from 'react-icons/io5'

import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { useAuth } from '@/hooks/useAuth'

export const LoginCard = () => {
  const { signInWithOAuth } = useAuth()

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
              onClick={() => signInWithOAuth('github')}
            >
              <IoLogoGithub className="size-4" />
              Login with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signInWithOAuth('google')}
            >
              <IoLogoGoogle className="size-4" />
              Login with Google
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
