export const recentSubmissionList = `
    query getUserSubmissions($username: String!) {
        recentSubmissionList(username: $username, limit: 1000) {
            title
            titleSlug
            status
            lang
            timestamp
        }
    }
`
