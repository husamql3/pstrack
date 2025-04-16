export const recentSubmissionListQuery = `
  query getUserSubmissions($username: String!) {
    recentSubmissionList(username: $username, limit: 100) {
      titleSlug
      status
    }
  }
`
