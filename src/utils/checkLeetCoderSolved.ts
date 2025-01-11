import { env } from 'process'

const DAILY_PROBLEM_QUERY = `
  query getUserRecentSubmissions($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    query userQuestionStatus($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
        status
      }
    }
  }
`

export const validateDailyProblemSolved = async (
  username: string,
  dailyProblemTitleSlug: string
): Promise<boolean> => {
  console.log('Validating daily problem submission for:', username)
  try {
    const response = await fetch(env.LEETCODE_API_URL as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: DAILY_PROBLEM_QUERY,
        variables: { username },
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    console.log('Data:', data)

    if (!data.data.matchedUser) {
      console.error('User not found:', username)
      return false
    }
    console.log('Daily problem title slug:', dailyProblemTitleSlug)

    const hasSolvedDailyProblem = data.data.matchedUser.recentSubmissionList.some(
      (submission: { titleSlug: string; status: string }) =>
        submission.titleSlug === dailyProblemTitleSlug && submission.status === 'Accepted'
    )

    console.log('Has solved daily problem:', hasSolvedDailyProblem)

    return hasSolvedDailyProblem
  } catch (error) {
    console.error('Error validating daily problem submission:', error)
    return false
  }
}
