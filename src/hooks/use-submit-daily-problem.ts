'use client'

import { useRouter } from 'next/navigation'

import { useConfettiStore } from '@/stores/confettiStore'
import { fetcher } from '@/utils/fetcher'
import { SubmitDailyProblem, UseSubmitDailyProblemReturn } from '@/types/submitDailyProblem.type'
import { toast } from '@/hooks/use-toast'

export const useSubmitDailyProblem = (): UseSubmitDailyProblemReturn => {
  const router = useRouter()
  const { triggerConfetti } = useConfettiStore()

  const submitDailyProblem = async ({
    user_id,
    problem_slug,
    problem_id,
    lc_username,
    group_no,
  }: SubmitDailyProblem): Promise<boolean> => {
    try {
      const res = await fetcher('/api/submit/daily', 'POST', {
        user_id,
        problem_slug,
        problem_id,
        lc_username,
        group_no,
      })
      console.log(res)

      toast({
        title: 'Great job!',
        description: 'Problem submitted successfully!',
        variant: 'success',
      })

      router.refresh()
      triggerConfetti()
      return true
    } catch (error) {
      if (error instanceof Error && error.message === 'User has not solved the problem') {
        toast({
          title: 'Are you sure you solved this problem?',
          description: 'Please solve the problem on LeetCode before submitting.',
          variant: 'destructive',
        })
        return false
      }

      toast({
        title: 'Error',
        description: 'Failed to submit problem. Please try again.',
        variant: 'destructive',
      })
      return false
    }
  }

  return { submitDailyProblem }
}
