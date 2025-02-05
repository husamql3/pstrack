export const getSocialLink = (
  username: string,
  platform: 'github' | 'twitter' | 'linkedin'
): string => {
  if (username.startsWith('http')) return username

  const baseUrls = {
    github: 'https://github.com/',
    twitter: 'https://twitter.com/',
    linkedin: 'https://linkedin.com/in/',
  }

  return `${baseUrls[platform]}${username}`
}
