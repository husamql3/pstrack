export const userProfileQuery = `
  query userProfileCalendar($username: String!) {
    matchedUser(username: $username) {
      userCalendar {
        streak
        totalActiveDays
        submissionCalendar
      }
    }
  }
`
