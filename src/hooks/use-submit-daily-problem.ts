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
    problem_id,
    group_no,
  }: SubmitDailyProblem): Promise<boolean> => {
    try {
      // todo: check if the user did not solve the problem using gql leetcode api

      await fetcher('/api/submit/daily', 'POST', {
        user_id,
        problem_id,
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
