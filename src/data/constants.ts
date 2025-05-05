import pLimit from 'p-limit'

export const VERSION = '2.1.13'
export const VISIBLE_COUNT = 20
export const PROBLEM_BASE_URL = 'https://leetcode.com/problems'
export const LEETCODE_GQL_BASE_URL = 'https://leetcode.com/graphql'
export const AUTHOR_EMAIL = 'husamahmud@gmail.com'
export const ADMINS_EMAILS = ['husamahmud@gmail.com', 'nezhataghy@gmail.com']
export const PROTECTED_ROUTES = ['/dashboard', '/profile']
export const UNSOLVED_THRESHOLD = 6
export const USERNAME = 'husamahmud'
export const REPO_NAME = 'pstrack'
export const MAX_LEETCODERS = 35
export const NOT_STARTED_GROUPS = [7]

export const BATCH_SIZE = 20
export const DELAY_MS = 1000
export const LIMIT = pLimit(5)
