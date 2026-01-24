# FEATURES

1. Sign up
    I. The user selects his group
    II. Admin approve
    III. Sent approval email
2. Daily problem
3. Problems
    1. User pause (2 times) (PAUSED)
        1. Excuse form, reason
        2. Admin approve
    2. 3 misses (SUSPENDED)
    3. Problem solved
4. Operations
    1. User needs to change his group
        - User request
        - Admin approve
    2. Groups Page
        - User can request to start a new group (public/private)
            - User can share the group link to invite his friends
5. Community
    - Leaderboard Page
        - Platform's leaderboard:
            - Top groups -> Group 1: 70 pts
            - Top 50 member
        - Groups's leaderboard:
            - s
        - NOTES:
            - weekly post about the leaderboard
            - points history in user's profile (visible for others)
            - -points for inactivity/improper content
        - Points:
            - when solve a problem
            - by timestamps (earliest)
            - when share a solution (w/ resource?)
            - when commenting on a solution // review
            - share a resource
            - points on the first submission
    - Resources Page
        - user can add a resource
        - admin must approve
    - Solutions Page
        - List all solutions for the user's group
            - at the bottom (show other groups' solutions)
        - showing "share your solution" modal after solving a problem
        - in the Problems (redirect to solutions page)
        - add comment on a solution
    - Feed Page
        - x shared his solution
            - eg. (husam shared his solution for 1. two-sum problem)
        - y shared a resource (after admin approval)
        - z commented on a solution
6. User profile
    - info
        - username
        - info (x/linkedin/website)
        - isVisible
        - avatar
        - connect/disconnect leetcode (oath)
    - change group

---

## Techs

- Client
  - react, tanstack-start [example](https://alchemy.run/guides/cloudflare-tanstack-start/)
  - Reui
- Server
  - Nest
  - Sentry
  - T3-env
  - Drizzle
  - Redis
- DevOps
  - `Dokploy` for the server
    - Docker [example](https://github.com/dung204/bunest/blob/main/Dockerfile)
    - PM2
  - alchemy for the client
- Tooling
  - Oxlint
  - Bun (only runtime, no utils)
  - Lefthook
  - Turborepo
