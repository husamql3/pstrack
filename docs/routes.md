# Routes

## Client Routes (TanStack Router)

### Public (unauthenticated)

| Route | Page |
|---|---|
| `/` | Landing page - marketing, CTA to sign up |
| `/login` | Login form |
| `/signup` | Sign up form |
| `/verify-email` | Email verification confirmation |
| `/forgot-password` | Request password reset email |
| `/reset-password` | Set new password (via token from email) |
| `/$username` | Public user profile (vanity URL; collides with reserved-words list) |

### Authenticated

| Route | Page |
|---|---|
| `/onboarding` | Post-signup: connect handles, browse + join a group |
| `/dashboard` | Today's problem, solve/pause actions, my streak, group snapshot |
| `/problems` | NeetCode 250 roadmap - full list with personal solve history |
| `/leaderboard` | Global leaderboard (Pro gate) |
| `/leaderboard/$groupId` | Group leaderboard |
| `/groups` | Browse public groups, search, join |
| `/groups/new` | Create group form |
| `/groups/$groupId` | Group overview: today's problem, member list, group leaderboard |
| `/groups/$groupId/settings` | Edit group name, description, type (admin only) |
| `/groups/$groupId/members` | Member list, remove member (admin only) |
| `/groups/$groupId/join-requests` | Pending join requests, approve / reject (admin only) |
| `/settings` | Redirect to `/settings/account` |
| `/settings/account` | Email, connected providers, active sessions, delete account (disabled) |
| `/settings/profile` | Username (30-day cooldown), display name, bio, LeetCode/Codeforces handles, socials, visibility |
| `/settings/notifications` | Daily reminder time (disabled placeholder) + three email preference toggles |
| `/settings/billing` | Pro status, upgrade CTA, purchase history |
| `/help` | "Coming soon" stub for FAQ + help content |

### Admin (platform admin only)

| Route | Page |
|---|---|
| `/admin` | Overview stats |
| `/admin/users` | Search, view, adjust points, ban users |
| `/admin/groups` | Search, view, dissolve groups |
| `/admin/problems` | NeetCode 250 list, seed / edit problems |

---

## API Routes (Elysia - Eden Treaty contract)

Base: `/api`

### Auth

Handled entirely by Better Auth at `/api/auth/*` (sign in, sign up, session, verify email, reset password, Polar webhook).

### Problems

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/problems/today` | Required | Today's problem for user's group, with solve status |
| `GET` | `/api/problems/roadmap` | Required | Full NeetCode 250 list with user's solve history |
| `POST` | `/api/problems/today/solve` | Required | Mark today's problem as solved - triggers verification job |
| `POST` | `/api/problems/today/pause` | Required | Pause today - consumes 1 pause, sets status to PAUSED |

### Groups

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/groups` | Optional | List public groups (paginated, search by name) |
| `POST` | `/api/groups` | Required | Create a new group |
| `GET` | `/api/groups/:id` | Optional | Group detail (name, description, member count, type) |
| `PATCH` | `/api/groups/:id` | Admin | Update group name, description |
| `DELETE` | `/api/groups/:id` | Admin | Deactivate group (`isActive = false`) |
| `POST` | `/api/groups/:id/join` | Required | Request to join (public) or join instantly (private, requires valid invite code) |
| `POST` | `/api/groups/:id/leave` | Member | Leave group |
| `GET` | `/api/groups/:id/members` | Member | List group members with points + streak |
| `DELETE` | `/api/groups/:id/members/:userId` | Admin | Remove member from group |
| `GET` | `/api/groups/:id/join-requests` | Admin | List PENDING join requests |
| `PATCH` | `/api/groups/:id/join-requests/:requestId` | Admin | Approve or reject join request |
| `POST` | `/api/groups/:id/invite` | Admin | Generate or refresh invite link (with optional expiry) |
| `DELETE` | `/api/groups/:id/invite` | Admin | Revoke invite link |

### Leaderboard

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/leaderboard/global` | Pro | Global top 100 users, filterable by `?period=week\|month\|alltime` |
| `GET` | `/api/leaderboard/groups/:id` | Member | Group leaderboard, same period filter |

### Users

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | Required | Current user profile, stats, pauses remaining |
| `PATCH` | `/api/users/me` | Required | Update username (cooldown), display name, bio, handles, social links, visibility, notification prefs |
| `POST` | `/api/users/check-username` | Optional | Validates regex, reserved-words list, and uniqueness; returns `{ available, reason? }` |
| `GET` | `/api/users/:username` | Optional | Public profile (respects `isPublic`; private profiles return a placeholder shape) |
| `GET` | `/api/users/me/sessions` | Required | Active Better Auth sessions (device, IP, last-active) |
| `DELETE` | `/api/users/me/sessions/:id` | Required | Revoke a single session (or `/sessions/others` for sign-out-everywhere) |
| `DELETE` | `/api/users/me` | Required | Delete account (cascades all data) - disabled in UI for MVP |

### Admin

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/admin/users` | Platform admin | Paginated user list with search |
| `PATCH` | `/api/admin/users/:id` | Platform admin | Adjust points (logs to PointsHistory), ban user |
| `GET` | `/api/admin/groups` | Platform admin | All groups list |
| `DELETE` | `/api/admin/groups/:id` | Platform admin | Hard dissolve group |
| `GET` | `/api/admin/problems` | Platform admin | Full problem list |
| `POST` | `/api/admin/problems/seed` | Platform admin | Seed NeetCode 250 problems into DB |
| `GET` | `/api/admin/stats` | Platform admin | DAU, solve rate, active groups count |

---

## Auth Role Levels

| Level | Description |
|---|---|
| Optional | Works with or without session |
| Required | Must be authenticated |
| Member | Must be authenticated + member of the group |
| Admin | Must be authenticated + `ADMIN` role in that group |
| Platform admin | Internal admin flag on `User` |
| Pro | Must be authenticated + `user.isPro = true` |
