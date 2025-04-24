/**
 * Extracts the username from a given input string based on the specified platform.
 * @param input - The input string containing the username.
 * @param platform - The platform from which to extract the username.
 * @returns The extracted username.
 */
export const extractUsername = (
  input: string,
  platform: 'github' | 'twitter' | 'linkedin'
): string => {
  const patterns = {
    github: /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+)\/?$/,
    twitter: /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/?$/,
    linkedin: /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|company)\/([a-zA-Z0-9-]+)\/?$/,
  }

  const match = input.match(patterns[platform])
  return match ? match[1] : input
}

/**
 * Generates a social link for the given username and platform.
 * @param username - The username to generate the link for.
 * @param platform - The platform for which to generate the link.
 * @returns The generated social link.
 */
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
