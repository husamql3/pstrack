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
