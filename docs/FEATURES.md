# Features

## MVP Scope

### 1. Auth & Onboarding

- Sign up: username, email, password
- Email verification (Resend)
- Connect LeetCode handle (required) and Codeforces handle (optional) post-signup
- Login / logout / forgot password / reset password
- Onboarding step: browse groups and request to join one
- hashvatar generated from username - no uploads

### 2. Daily Problem System

**Assignment**
- All active groups receive the same daily problem at midnight
- Problems sourced sequentially from NeetCode 250 roadmap
- Trigger.dev cron job: `assign-daily-problem`

**Verification Flow**
1. User clicks "Mark as Solved"
2. The request synchronously checks LeetCode for an accepted submission matching:
   - Problem ID
   - Timestamp after problem assignment
   - Status = Accepted
3. If verified: `UserSolve` status → `SOLVED`, points awarded, streak incremented
4. If not found: no solve row is created on the first monthly grace failure; later monthly failures are treated as a miss

**Pause**
- User clicks "Pause Today" - status → `PAUSED`, streak preserved, -5 points
- Consumes 1 pause from `pausesUsedThisMonth`
- Allowed: Free 2/month, Pro 4/month
- Auto-approved, no excuse needed

**Miss**
- If user does neither for their primary group by end of day: status → `MISSED` via nightly job
- Streak breaks, -3 points

### 3. Groups

**Types**
- **Public** - request to join, admin approves or rejects, request expires in 1 day
- **Private** - invite link only, instant join on valid link, no approval needed

**Limits**
- Free: join 1 group, group capacity 30 members
- Pro: join up to 5 groups, group capacity 50 members (for Pro-created groups)

**Creating a Group**
- Any user can create a group
- Creator becomes group admin
- Free users can only create public groups
- Pro users can create public or private groups

**Invite Links** (private groups)
- Admin generates invite link with expiry (7 / 30 / 90 days or never)
- Admin can revoke invite link at any time

**Group Admin Actions**
- Approve / reject join requests (public groups)
- Remove members
- Update group name, description
- Generate / revoke invite link (private groups)

**Leaving a Group**
- User can leave at any time
- Points and streak belong to the user, not the group
- Membership exits are soft-removals: the member disappears from normal UI/capacity/access, but the row is retained for audit and rejoin handling

**Inactivity Accountability**
- 5 consecutive missed required days triggers one warning for the current miss streak
- Public groups auto-remove regular members if the next required day is also missed
- Private groups send the warning nudge only; they do not auto-remove
- Solving or pausing resolves the warning immediately

### 4. Points & Gamification

**Earning**
| Action | Points |
|---|---|
| Solve daily problem | +10 |
| First in group to solve | +5 |

**Losing**
| Action | Points |
|---|---|
| Miss (no pause) | -3 |

**Streak Multipliers** (applied to solve points only)
| Streak | Multiplier |
|---|---|
| 7 days | 1.2x |
| 30 days | 1.5x |

**Badges**
| Badge | Condition |
|---|---|
| Streak 7 / 30 / 100 | Reach that streak length |
| First Solver 10 / 50 | Be first in group N times |
| Consistent 30 | 30 days solved with no misses |

### 5. Leaderboard

- **Group leaderboard** - all tiers, ranked by total points, filterable by week / month / all-time
- **Global leaderboard** - Pro only, top 100 users platform-wide, same time filters
- No Twitter auto-post

### 6. User Profile

**Public**
- Username, hashvatar, bio, social links
- Total points, current streak, longest streak
- Badges earned
- Groups joined

**Private (user only)**
- Email, connected handles
- Points history breakdown
- Pauses remaining this month

**Settings**
- Update bio, social links
- Change LeetCode / Codeforces handle
- Toggle profile visibility (public / private)
- Email notification preferences
- Delete account

### 7. Freemium (Polar via Better Auth)

- Pro status stored on `User.isPro`
- Better Auth Polar plugin handles purchase flow, webhooks, and session enrichment
- One-time payment: $14 standard, $9 sale
- Promo codes supported natively in Polar

### 8. Email Notifications (Resend)

See [notifications.md](./notifications.md) for full event list.

### 9. Admin Dashboard

- View and search all users
- Manually adjust points (with reason logged to `PointsHistory`)
- Dissolve inactive groups
- Seed / manage NeetCode 250 problem list

---

## Post-MVP

| Feature | Notes |
|---|---|
| Solutions sharing | Submit solution, view group + platform solutions, upvotes |
| Activity feed | Group-scoped, poll every 30s, no WebSocket |
| Resources hub | Submit links, community upvote, no admin approval queue |
| In-app notification inbox | Requires Upstash Realtime or polling |
| Redis leaderboard cache | Add when DB queries become slow |
| PostHog analytics | Add after user base grows |
| Custom roadmaps | Pro admin perk - choose roadmap for their group |
