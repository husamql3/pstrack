# Features Specification

## 1. Authentication & Onboarding

### Sign Up Flow

1. User enters:
   - Username (unique)
   - Email
   - LeetCode handle
   - Codeforces handle (optional)
2. Email verification sent
3. User selects group to join
4. Welcome email sent upon approval

### Profile Setup

- Avatar upload (auto-resized via Sharp)
- Social links (X, LinkedIn, personal website)
- Visibility settings (public/private profile)
- Change group

---

## 2. Daily Problem System

### Problem Assignment

- One problem per group every day
- Problems sourced from NeetCode 250 roadmap
- Auto-assigned based on group difficulty tier
- Problems posted at midnight (similar to leetcode)

### Verification Flow

1. User marks problem as "Solved"
2. System triggers background job (Trigger.dev)
3. Checks LeetCode/Codeforces API for recent submissions
4. Validates:
   - Problem ID matches
   - Submission timestamp is after problem assignment
   - Submission status is "Accepted"
5. Awards points if verified
6. Updates user's streak

---

## 3. Pause & Excuse System

### Pause Allowance

- **Free users**: 2 pauses per month
- **Premium users**: 2 pauses per month
- Pauses reset on 1st of each month

### Excuse Submission

1. User clicks "Pause Today"
2. Optional excuse form:
   - Reason (text field, max 200 chars)
   - Category (Vacation, Illness, Emergency, Personal, Other)
3. Auto-approved for first 2 pauses
4. Admin review for additional pauses (premium only)

### Consequences

- **Unexcused miss**: -3 coins, breaks streak
- **3 unexcused misses in 30 days**: 7-day suspension
- **Suspension rules**:
  - User cannot solve problems during suspension
  - Cannot earn points
  - Streak is frozen (not lost)
  - After 3 total suspensions: permanent removal from group
  - User can appeal via support form

---

## 4. Group Management

### Group Types (30 members max)

- **Public**: Anyone can join (admin approval)
- **Private**: Invite-only (admin approval)
- **Premium**: Custom branding, up to 50 members (paid feature)

### Group Operations

1. **Create Group**:
   - User requests group creation
   - Admin approves (prevents spam)
   - Creator becomes group admin â‰ï¸
2. **Join Group**:
   - Public: request + admin approval
   - Private: request + admin approval
3. **Change Group**:
   - User can switch groups once per month
   - Keeps all points and streak
   - Admin approval required for private groups
4. **Invite Links**:
   - Generate shareable invite URLs
   - Set expiration (7/30/90 days or never)
   - Track invite usage

### Group Settings (Admin) â‰ï¸

- Approve/deny join requests
- Manage members (suspend, remove)
- Approve excuses

---

## 5. Community Features

### Leaderboard

- **Platform Leaderboard**:
  - Top 10 groups (by avg points per member)
  - Top 50 individual users (all time)
  - Top 50 users (this month)
- **Group Leaderboard**:
  - All group members ranked by points
  - Filterable by time period (week/month/all time)
- **Weekly Twitter Post** (via @husamql3)
  - Auto-generated image with top performers
  - Posted via cron job (Trigger.dev)
  - Mention them in the tweet

### Resources Hub

1. **Submit Resource**:
   - Title, URL, description
   - Category (Article, Video, Tool, Course)
   - Tags (algorithms, data structures, etc.)
2. **Admin Approval**:
   - Review queue for admins
   - Approve/reject with optional feedback
3. **Display**:
   - Sortable by category, votes, date
   - Upvote/downvote system
   - Comment threads

### Solutions Sharing

1. **Submit Solution**:
   - using <https://diffs.com>
   - Language selection
   - Explanation (markdown supported)
2. **Viewing**:
   - Primary: solutions from your group
   - Secondary: solutions from other groups (below fold)
   - Filter by language, votes
3. **Code Comments**:
   - Click line number to add comment
   - Threading support (reply to comments)
   - Markdown in comments
4. **Rewards**:
   - Share solution: +8 coins
   - Receive upvote: +1 coin (max 10/day)

### Activity Feed

- Real-time feed of:
  - User solved problem
  - User shared solution
  - User shared resource (approved)
  - User commented on solution
  - User achieved streak milestone
  - New user joined group
- Pagination: 20 items per page
- Filter by activity type
- Subscribe to user activity (follow feature) â‰ï¸

---

## 6. Points & Gamification

### Earning Points

| Action                  | Points | Notes                    |
| ----------------------- | ------ | ------------------------ |
| Solve daily problem     | +10    | Base reward              |
| Solve within 6 hours    | +5     | Early bird bonus         |
| First in group          | +15    | Competition incentive    |
| First on platform       | +25    | Elite achievement        |
| Share solution          | +8     | One-time per problem     |
| Quality comment         | +3     | Max 5/day, auto-detected |
| Approved resource       | +5     | One-time                 |
| Receive solution upvote | +1     | Max 10/day               |

### Losing Points

| Action                   | Penalty |
| ------------------------ | ------- |
| Miss problem (unexcused) | -3      |
| Spam/low-quality content | -10     |
| Rule violation           | -25     |

### Streak Multipliers

- **7-day streak**: 1.2 — all points
- **14-day streak**: 1.5 — all points
- **30-day streak**: 2 — all points + exclusive badge
- **Streak protection**: Premium users get 1 "streak freeze" per month

### Badges

- ðŸ”¥ Fire Streak (7/14/30/100 days)
- ðŸ† First Solver (10/50/100 times first in group)
- ðŸ’¡ Solution Master (50/100/250 solutions shared)
- ðŸŽ¯ Consistent (solve 30 days in a row without pauses)
- ðŸ‘‘ Legend (top 10 all-time leaderboard)

---

## 7. User Profile

### Public Info

- Username, avatar
- Bio and social links
- Total points & current rank
- Current streak & longest streak
- Badges earned
- Recent activity (last 10 solves)
- Groups joined

### Private Info (visible only to user)

- Email
- Connected accounts (LeetCode, Codeforces)
- Points history (detailed breakdown)
- Pauses remaining this month
- Suspension history

### Settings

- Change username (once per 30 days)
- Update bio and links
- Visibility toggle (public/private profile)
- Email notification preferences
- Timezone
- Delete account (with confirmation)

---

## 8. Admin Dashboard

### Features

- **User Management**:
  - View all users
  - Search by username/email
  - Suspend/unsuspend users
  - Manual solve verification
- **Group Management**:
  - Approve new group requests
  - Manage group admins
  - Dissolve inactive groups
- **Content Moderation**:
  - Review resource submissions
  - Review reported solutions/comments
  - Ban spam accounts
- **Analytics**:
  - Daily active users
  - Problem solve rate
  - Most active groups
  - User retention metrics (via PostHog)

---

## 9. Routes & Pages

| Route                     | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `/`                       | Landing/dashboard (logged in: today's problem) |
| `/login`                  | Authentication page                            |
| `/signup`                 | Registration flow                              |
| `/onboarding`             | Post-signup setup wizard                       |
| `/dashboard`              | User's personalized dashboard                  |
| `/problems`               | All problems (history & upcoming)              |
| `/resources`              | Community resource hub                         |
| `/roadmap`                | NeetCode 250 progress tracker                  |
| `/leaderboard`            | Platform-wide rankings                         |
| `/leaderboard/:groupId`   | Group-specific rankings                        |
| `/feed`                   | Activity feed                                  |
| `/solutions`              | a list for latest shared solutions             |
| `/solutions/:problemSlug` | Solutions for specific problem                 |
| `/groups`                 | Browse/create groups                           |
| `/groups/:groupId`        | Group detail page                              |
| `/profile`                | Current user's profile                         |
| `/profile/:username`      | Public user profile                            |
| `/settings`               | Account settings                               |
| `/admin`                  | Admin dashboard (restricted)                   |
