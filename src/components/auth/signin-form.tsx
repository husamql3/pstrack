'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

import { signIn } from '@/db/supabase/services/auth.service'
import { toast } from '@/hooks/use-toast'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TbLoader2 } from 'react-icons/tb'

const SignInForm = () => {
  const router = useRouter()
  const [state, action, isPending] = useActionState(signIn, {
    success: false,
    message: '',
  })

  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [password, setPassword] = useState('')

  const toggleVisibility = () => setIsVisible((prevState) => !prevState)

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
          type="email"
          placeholder="Enter email"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            className="pe-9"
            name="password"
            placeholder="Enter password"
            type={isVisible ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-strength"
          />
          <button
            className="text-muted-foreground/80 focus-visible:outline-ring/70 hover:text-foreground absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg outline-offset-2 transition-colors focus:z-10 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={toggleVisibility}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <EyeOff
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            ) : (
              <Eye
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={isPending}
      >
        {isPending && <TbLoader2 className="mr-2 h-4 w-4 animate-spin" />}
        Login
      </Button>
    </form>
  )
}

export { SignInForm }
