# Database Schema

ORM: **Prisma**
Database: **Neon (PostgreSQL)**

## Design Principles

- Points stored denormalized (`user.totalPoints`) and historically (`PointsHistory`) - denormalized for fast leaderboard queries
- `DailyProblem` has `groupId` - keeps schema ready for per-group roadmap choice (Pro feature, post-MVP)
- Cascade deletes on all membership and solve relations
- `UserSolve.status` is the single source of truth for terminal daily outcomes: `SOLVED | PAUSED | MISSED`
- Better Auth manages `Session`, `Account`, `Verification` - do not add business logic to these tables
- Streaks break on `MISSED`, never on `PAUSED` or failed verification clicks. Verification failures are tracked separately on `User.verificationFailuresThisMonth` and do not create solve rows.

## Tables

| Table | Purpose |
|---|---|
| `User` | Platform user - points, streak, Pro status, notification prefs |
| `Group` | Group container (public or private) |
| `GroupMember` | User ↔ Group membership + role |
| `GroupJoinRequest` | Pending join requests for public groups (expire after 1 day) |
| `Problem` | NeetCode 250 problem definitions (evergreen, seeded by admin) |
| `DailyProblem` | One problem assigned per group per day |
| `UserSolve` | User's outcome for a daily problem (one row per user per group per day) |
| `PointsHistory` | Immutable audit log of all point changes |
| `Badge` | Badge definitions (static, seeded) |
| `UserBadge` | Badges earned by users |
| `Session` | Better Auth |
| `Account` | Better Auth |
| `Verification` | Better Auth |

## Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                  String   @id
  username            String   @unique
  email               String   @unique
  emailVerified       Boolean  @default(false)
  leetcodeHandle      String?
  codeforcesHandle    String?
  bio                 String?
  twitterHandle       String?
  linkedinHandle      String?
  websiteUrl          String?
  isPublic            Boolean  @default(true)
  isPro               Boolean  @default(false)
  isAdmin             Boolean  @default(false)
  isBanned            Boolean  @default(false)
  totalPoints         Int      @default(0)
  currentStreak       Int      @default(0)
  longestStreak       Int      @default(0)
  pausesUsedThisMonth Int      @default(0)
  // notification preferences
  notifyDailyProblem  Boolean  @default(true)
  notifyAchievements  Boolean  @default(true)
  notifyGroupActivity Boolean  @default(true)
  // username change cooldown
  usernameChangedAt   DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  groupMemberships GroupMember[]
  joinRequests     GroupJoinRequest[]
  solves           UserSolve[]
  pointsHistory    PointsHistory[]
  userBadges       UserBadge[]
  sessions         Session[]
  accounts         Account[]

  @@index([totalPoints])
  @@index([currentStreak])
}

model Group {
  id              String    @id @default(cuid())
  name            String
  description     String?
  type            GroupType
  creatorId       String
  maxMembers      Int       @default(30)
  inviteCode      String?   @unique
  inviteExpiresAt DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  members       GroupMember[]
  joinRequests  GroupJoinRequest[]
  dailyProblems DailyProblem[]

  @@index([type, isActive])
}

enum GroupType {
  PUBLIC
  PRIVATE
}

model GroupMember {
  id            String                    @id @default(cuid())
  groupId       String
  userId        String
  role          MemberRole                @default(MEMBER)
  status        GroupMemberStatus         @default(ACTIVE)
  joinedAt      DateTime                  @default(now())
  removedAt     DateTime?
  removalReason GroupMemberRemovalReason?

  warnings GroupMemberWarning[]

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@index([groupId, status])
  @@index([userId])
}

enum MemberRole {
  ADMIN
  MEMBER
}

enum GroupMemberStatus {
  ACTIVE
  REMOVED
}

enum GroupMemberRemovalReason {
  AUTO_INACTIVITY
  ADMIN_REMOVED
  LEFT_GROUP
}

model GroupMemberWarning {
  id                 String             @id @default(cuid())
  groupMemberId      String
  warningMissedCount Int
  warnedAt           DateTime           @default(now())
  resolvedAt         DateTime?
  resolution         WarningResolution?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  groupMember GroupMember @relation(fields: [groupMemberId], references: [id], onDelete: Cascade)

  @@index([groupMemberId, resolvedAt])
}

enum WarningResolution {
  SOLVED_OR_PAUSED
  AUTO_REMOVED
  ADMIN_REMOVED
  LEFT_GROUP
}

model GroupJoinRequest {
  id        String            @id @default(cuid())
  groupId   String
  userId    String
  status    JoinRequestStatus @default(PENDING)
  expiresAt DateTime
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@index([status, expiresAt])
}

enum JoinRequestStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

model Problem {
  id           String     @id @default(cuid())
  slug         String     @unique
  title        String
  difficulty   Difficulty
  topics       String[]
  roadmapIndex Int        @unique
  leetcodeId   Int?
  codeforcesId String?

  dailyProblems DailyProblem[]
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

model DailyProblem {
  id             String    @id @default(cuid())
  groupId        String
  problemId      String
  assignedDate   DateTime  @db.Date
  firstSolverId  String?
  firstSolveTime DateTime?

  group   Group       @relation(fields: [groupId], references: [id])
  problem Problem     @relation(fields: [problemId], references: [id])
  solves  UserSolve[]

  @@unique([groupId, assignedDate])
  @@index([assignedDate])
}

model UserSolve {
  id             String      @id @default(cuid())
  userId         String
  dailyProblemId String
  status         SolveStatus @default(MISSED)
  pointsEarned   Int         @default(0)
  isFirstInGroup Boolean     @default(false)
  verifiedAt     DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  dailyProblem DailyProblem @relation(fields: [dailyProblemId], references: [id])
  pointsHistory PointsHistory[]

  @@unique([userId, dailyProblemId])
  @@index([userId])
}

enum SolveStatus {
  SOLVED
  PAUSED
  MISSED
}

model PointsHistory {
  id          String      @id @default(cuid())
  userId      String
  userSolveId String?
  delta       Int
  reason      PointReason
  adminNote   String?
  createdAt   DateTime    @default(now())

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userSolve UserSolve? @relation(fields: [userSolveId], references: [id])

  @@index([userId, createdAt])
}

enum PointReason {
  DAILY_SOLVE
  FIRST_IN_GROUP
  STREAK_MULTIPLIER_BONUS
  MISSED_DAY
  ADMIN_ADJUSTMENT
}

model Badge {
  id          String @id @default(cuid())
  key         String @unique
  name        String
  description String

  userBadges UserBadge[]
}

model UserBadge {
  id       String   @id @default(cuid())
  userId   String
  badgeId  String
  earnedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge Badge @relation(fields: [badgeId], references: [id])

  @@unique([userId, badgeId])
}

// Better Auth - do not modify
model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  accessToken           String?
  refreshToken          String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Business Rules

| Rule | Enforced in |
|---|---|
| One solve per user per daily problem | `@@unique([userId, dailyProblemId])` on `UserSolve` |
| One active join request per user per group | `@@unique([groupId, userId])` on `GroupJoinRequest` |
| One problem per group per day | `@@unique([groupId, assignedDate])` on `DailyProblem` |
| `pausesUsedThisMonth` resets on the 1st of each month | Trigger.dev `reset-monthly-pauses` cron |
| Join requests expire after 1 day | `expiresAt` set on creation; hourly `expire-join-requests` cron marks EXPIRED |
| Free groups: `maxMembers = 30` / Pro groups: `maxMembers = 50` | Set at group creation based on creator's `isPro` |
| Removed members are hidden from normal app behavior | All member reads, counts, primary-group selection, and private access filter `GroupMember.status = ACTIVE` |
| Public-group inactivity removal | `GroupMemberWarning` after 5+ current misses; a later miss soft-removes regular members with `removalReason = AUTO_INACTIVITY` |
| Username can change at most once per 30 days | `usernameChangedAt` checked in `PATCH /api/users/me`; UI disables the field and shows next available date |
| Username must match `^[a-z0-9_-]{3,30}$` and not collide with reserved words | Enforced in `usersModel` (TypeBox) + reserved-words list in `users.constants.ts` |
| Streak breaks on `MISSED`, preserved on `PAUSED` | Application logic in synchronous solve verification and the `mark-missed` job |
| Platform admin access gated on `User.isAdmin` (set manually in DB) | Elysia middleware on `/api/admin/*` |

## Points Reference

| Action | Delta | `PointReason` |
|---|---|---|
| Solve daily problem | +10 | `DAILY_SOLVE` |
| First in group to solve | +5 | `FIRST_IN_GROUP` |
| Streak multiplier bonus (7d: +2, 30d: +5 per solve) | varies | `STREAK_MULTIPLIER_BONUS` |
| Miss (no pause used) | -3 | `MISSED_DAY` |
| Admin manual adjustment | varies | `ADMIN_ADJUSTMENT` |

> Streak multipliers (1.2x at 7 days, 1.5x at 30 days) are applied to the base +10 solve points. The bonus delta is logged separately as `STREAK_MULTIPLIER_BONUS` so the base solve and the bonus are individually auditable.

## Badge Keys (seeded)

| Key | Condition |
|---|---|
| `STREAK_7` | Reach a 7-day streak |
| `STREAK_30` | Reach a 30-day streak |
| `STREAK_100` | Reach a 100-day streak |
| `FIRST_SOLVER_10` | Be first in group 10 times |
| `FIRST_SOLVER_50` | Be first in group 50 times |
| `CONSISTENT_30` | 30 days solved with no misses |

## Post-MVP Tables

When community features ship, add:

- `Solution` - shared solutions for a daily problem
- `Comment` - comments on solutions
- `Vote` - upvotes on solutions
- `Resource` - community-submitted links
- `Notification` - in-app inbox entries (requires Upstash Realtime)
