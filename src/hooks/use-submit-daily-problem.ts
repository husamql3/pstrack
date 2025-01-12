'use client'

import { useRouter } from 'next/navigation'

import { fetcher } from '@/utils/fetcher'
import {
  SubmitDailyProblem,
  UseSubmitDailyProblemReturn,
} from '@/types/submitDailyProblem.type'

export const useSubmitDailyProblem = (): UseSubmitDailyProblemReturn => {
  const router = useRouter()

  const submitDailyProblem = async ({
    user_id,
    problem_slug,
    problem_id,
    lc_username,
    group_no,
  }: SubmitDailyProblem): Promise<boolean> => {
    try {
      await fetcher('/api/submit/daily', 'POST', {
        user_id,
        problem_slug,
        problem_id,
        lc_username,
        group_no,
      })

      router.refresh()
      return true
    } catch (error) {
      console.error('Error submitting daily problem:', error)
      return false
    }
  }

  return { submitDailyProblem }
}
