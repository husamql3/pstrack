'use client'

import { ZodError } from 'zod'
import { User } from '@supabase/auth-js'

import { fetcher } from '@/lib/fetcher'
import { toast } from '@/hooks/use-toast'

export const handleInsertLeetcoder = async (
  formData: FormData,
  user: User,
  groupId: string
): Promise<boolean> => {
  const data = {
    name: formData.get('name'),
    username: formData.get('username'),
    email: user.email,
    group_no: groupId,
    id: user.id,
    gh_username: formData.get('gh_username') || '',
    lc_username: formData.get('lc_username') || '',
    status: 'pending',
  }

  try {
    await fetcher('/api/request', 'POST', data)
    toast({
      title: 'Request submitted!',
      description:
        'Your request is under review. You will be notified once it is approved.',
      variant: 'success',
    })
    return true
  } catch (error) {
    console.error('Error submitting request:', error)

    if (error instanceof ZodError) {
      toast({
        title: 'Validation Error',
        description: error.errors.map((err) => err.message).join(', '),
        variant: 'destructive',
      })
      return false
    }

    if (
      error instanceof Error &&
      error.message === 'You are already registered.'
    ) {
      toast({
        title: 'Registration Error',
        description: error.message,
        variant: 'destructive',
      })

      return false
    }

    toast({
      title: 'Submission failed',
      description:
        error instanceof Error
          ? error.message
          : 'An error occurred while submitting your request.',
      variant: 'destructive',
    })
    return false
  }
}
