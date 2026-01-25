# FEATURES

1. Sign up
    1. User enters username, LeetCode handle / Codeforces handle
    2. User selects group
    3. Admin approves the join request
    4. Approval email sent automatically

2. Daily Problem
    1. One problem per group every day
    2. Auto-verified via LeetCode/Codeforces public API
    3. User marks solved → system checks recent submissions

3. Problems
    1. User can pause up to 2 times
        1. Submit excuse form with reason (optionally)
        2. Admin approves excuse
    2. 3 unexcused misses → user suspended (user can be suspended only 3 times then kicked out from the platform)
    3. Solve daily problem from NeetCode 250 roadmap

4. Operations
    1. Change group
        - User requests new group
        - Admin approves request
    2. Groups page
        - User can request to create new public/private group
        - Share invite link for friends

5. Community
    1. Leaderboard page
        - Platform leaderboard (top groups + top 50 users)
        - Group leaderboard
        - Weekly leaderboard post on Twitter
    2. Resources page
        - Users submit resources
        - Admin approves resources
    3. Solutions page
        - Solutions for current group problem
        - Show other groups' solutions at bottom
        - Comment on solutions / specific line in solution code
    4. Feed page
        - Activity: solved problem, shared solution, shared resource, comments

6. Points System
    1. Daily solve: +10 coins
    2. First 6 hours: +5 bonus
    3. First in group: +15 bonus
    4. First on platform: +25 bonus
    5. Share solution: +8 coins
    6. Meaningful comment: +3 coins (max 5/day)
    7. Share approved resource: +5 coins
    8. 7-day streak: ×1.2 multiplier
    9. 14-day streak: ×1.5 multiplier
    10. 30-day streak: ×2 multiplier + badge
    11. Miss problem: -3 coins
    12. Spam/improper content: -10 coins

7. User Profile
    1. Username, bio, links (X, LinkedIn, website)
    2. Avatar
    3. Visibility setting
    4. Connected LeetCode (OAuth) & Codeforces accounts
    5. Points history (visible to others)
    6. Change group request

8. Pages
    - /
    - /resources
    - /roadmap
    - /leaderboard
    - /leaderboard/$groupId
    - /feed
    - /solutions/$problemSlug
    - /groups
    - /groups/$groupId
    - /profile
    - /profile/$username

## Techs

- Client
  - React
  - TanStack Router (file-based routing)
  - TanStack Query (data fetching & caching)
  - ShadCN

- Server
  - Hono (monorepo backend)
  - Drizzle ORM + Postgres
  - Upstash Redis (caching, rate limiting, queues)
  - Auth: @nestjs/passport + passport-jwt + custom LeetCode OAuth strategy
  - Email: Resend (transactional emails + React Email templates)
  - Sentry (error monitoring)
  - T3-env (type-safe environment variables)
  - BullMQ (background jobs: daily problem checks, streak calculations, suspensions)

- DevOps
  - Dokploy (deployment on medium VPS)
  - Docker + Docker Compose
  - PM2 (process manager)
  - Cloudflare (DNS + client static hosting via Pages)

- Tooling
  - Bun (package manager & runtime)
  - Turborepo (monorepo management)
  - Oxlint + ESLint + Prettier
  - Lefthook (git hooks)
  - Turborepo (optional monorepo environment)
  - GitHub Actions (CI/CD)
