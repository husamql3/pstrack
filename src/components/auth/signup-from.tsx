'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useEffect } from 'react'
import { TbLoader2 } from 'react-icons/tb'

import { signUp } from '@/db/supabase/services/auth.service'
import { toast } from '@/hooks/use-toast'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { InputPassword } from '@/components/auth/input-password'
import { Button } from '@/components/ui/button'

const SignUpForm = () => {
  const router = useRouter()
  const [state, action, isPending] = useActionState(signUp, {
    success: false,
    message: '',
  })

  useEffect(() => {
    if (state.message) {
      if (!state.success) {
        toast({
          description: state.message,
          variant: 'destructive',
        })
      } else {
        toast({
          description: state.message,
          variant: 'success',
        })
        router.push('/')
      }
    }
  }, [state.message, state.success, router])

  return (
    <form
      action={action}
      className="w-full space-y-4"
    >
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          placeholder="Enter email"
          required
        />
      </div>

      <InputPassword />

      <Button
        className="w-full font-medium"
        disabled={isPending}
      >
        {isPending && <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign Up
      </Button>
    </form>
  )
}

export default SignUpForm
