'use client'

import { IoLogoGithub, IoLogoGoogle } from 'react-icons/io5'

import { api } from '@/trpc/react'

import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const LoginCard = () => {
  const { mutateAsync: signInWithOAuth } = api.auth.signInWithOAuth.useMutation()

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
              onClick={() => signInWithOAuth({ provider: 'github' })}
            >
              <IoLogoGithub className="size-4" />
              Login with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signInWithOAuth({ provider: 'google' })}
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
