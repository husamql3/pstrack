import pLimit from 'p-limit'

/**
 * App version
 */
export const VERSION = '2.7.34'

/**
 * Repository information
 */
export const USERNAME = 'husamql3'
export const REPO_NAME = 'pstrack'

/**
 * UI configuration
 */
export const VISIBLE_COUNT = 20

/**
 * LeetCode URLs
 */
export const PROBLEM_BASE_URL = 'https://leetcode.com/problems'
export const LEETCODE_GQL_BASE_URL = 'https://leetcode.com/graphql'

/**
 * Admin management
 */
export const AUTHOR_EMAIL = 'husamahmud@gmail.com'
export const ADMINS_EMAILS = ['husamahmud@gmail.com', 'nezhataghy@gmail.com']

/**
 * Authentication and authorization
 */
export const PROTECTED_ROUTES = ['/dashboard']

/**
 * Problem tracking thresholds
 */
export const UNSOLVED_THRESHOLD = 6
export const MAX_LEETCODERS = 35
export const NOT_STARTED_GROUPS = [7, 8]

/**
 * API request configuration
 */
export const BATCH_SIZE = 20
export const DELAY_MS = 5000
export const LIMIT = pLimit(5)

/**
 * Redis cache configuration
 */
export const REDIS_KEYS = {
  ALL_GROUPS: 'all-groups',
  ALL_GROUPS_INFO: 'all-groups-info',
  ROADMAP_PROBLEM_COUNT: 'roadmap-problem-count',
  ROADMAP_DATA: 'roadmap-data',
  AVAILABLE_GROUPS: 'available-groups',
  GROUP_DATA: (groupId: string) => `group:${groupId}:data`,
  GROUP_PROBLEMS: (groupId: string) => `group:${groupId}:problems`,
  RESOURCES: 'resources',
}
