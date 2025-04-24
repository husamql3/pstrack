export const userProfile = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
    }
  }
`
