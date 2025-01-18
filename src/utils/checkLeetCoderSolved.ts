import { recentSubmissionListQuery } from '@/lib/graphql/recentSubmissionList.gql'
import {
  RecentSubmission,
  ValidateDailyProblemSolved,
} from '@/types/validateDailyProblemSolved.type'

export const validateDailyProblemSolved = async ({
  lc_username,
  problem_slug,
}: ValidateDailyProblemSolved): Promise<boolean> => {
  const payload = {
    query: recentSubmissionListQuery,
    variables: { username: lc_username },
  }
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Error validating daily problem submission:', response)
      return false
    }

    const data = await response.json()
    if (!data.data?.recentSubmissionList.length) {
      console.error('No submissions found for user:', lc_username)
      return false
    }

    // Check if the user has solved the specific problem
    return !!data.data.recentSubmissionList.some(
      (submission: RecentSubmission) =>
        submission.titleSlug === problem_slug && submission.status === 10
    )
  } catch (error) {
    console.error('Error validating daily problem submission:', error)
    return false
  }
}
