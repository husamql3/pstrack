export const checkGitHubUserExists = async (username: string): Promise<boolean> => {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    })

    return response.ok
  } catch (error) {
    console.error('Error checking GitHub user:', error)
    return false
  }
}
