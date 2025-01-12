import { recentSubmissionListQuery } from '@/lib/graphql/recentSubmissionList.gql'

type RecentSubmission = {
  title: string
  titleSlug: string
  status: number
  lang: string
  timestamp: string
}

type ValidateDailyProblemSolved = {
  lc_username: string
  problem_slug: string
}

export const validateDailyProblemSolved = async ({
  lc_username,
  problem_slug,
}: ValidateDailyProblemSolved): Promise<boolean> => {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: recentSubmissionListQuery,
        variables: { username: 'husamahmud' },
      }),
    })
    if (!response.ok) {
      console.error('Error validating daily problem submission:', response)
      return false
    }

    const data = await response.json()
    if (!data.data?.recentSubmissionList) {
      console.error('No submissions found for user:', lc_username)
      return false
    }

    // Check if the user has solved the specific problem
    return data.data.recentSubmissionList.some(
      (submission: RecentSubmission) =>
        submission.titleSlug === problem_slug && submission.status === 10
    )
  } catch (error) {
    console.error('Error validating daily problem submission:', error)
    return false
  }
}
