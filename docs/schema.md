# Database Schema

ORM: **Prisma**
Database: **Neon (PostgreSQL)**

## Design Principles

- Points stored denormalized (`user.totalPoints`) and historically (`PointsHistory`) — denormalized for fast leaderboard queries
- `DailyProblem` has `groupId` — keeps schema ready for per-group roadmap choice (Pro feature, post-MVP)
- Cascade deletes on all membership and solve relations
- `UserSolve.status` is the single source of truth for a day's outcome: `PENDING_VERIFICATION | SOLVED | PAUSED | MISSED | VERIFICATION_FAILED`
- Better Auth manages `Session`, `Account`, `Verification` — do not add business logic to these tables

## Tables

| Table | Purpose |
|---|---|
| `User` | Platform user, points, streak, Pro status |
| `Group` | Group container (public or private) |
| `GroupMember` | User ↔ Group membership + role |
| `GroupJoinRequest` | Pending join requests with 1-day expiry |
| `Problem` | NeetCode 250 problem definitions (evergreen) |
| `DailyProblem` | One problem assigned per group per day |
| `UserSolve` | User's outcome for a daily problem |
| `PointsHistory` | Immutable audit log of all point changes |
| `Badge` | Badge definitions |
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
  leetcodeHandle      String?
  codeforcesHandle    String?
  totalPoints         Int      @default(0)
  currentStreak       Int      @default(0)
  longestStreak       Int      @default(0)
  pausesUsedThisMonth Int      @default(0)
  isPro               Boolean  @default(false)
  bio                 String?
  twitterHandle       String?
  linkedinHandle      String?
  websiteUrl          String?
  isPublic            Boolean  @default(true)
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
  slug            String    @unique
  description     String?
  type            GroupType
  creatorId       String
  maxMembers      Int       @default(30)
  inviteCode      String?   @unique
  inviteExpiresAt DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  members      GroupMember[]
  joinRequests GroupJoinRequest[]
  dailyProblems DailyProblem[]

  @@index([type, isActive])
}

enum GroupType {
  PUBLIC
  PRIVATE
}

model GroupMember {
  id       String     @id @default(cuid())
  groupId  String
  userId   String
  role     MemberRole @default(MEMBER)
  joinedAt DateTime   @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
  @@index([userId])
}

enum MemberRole {
  ADMIN
  MEMBER
}

model GroupJoinRequest {
  id        String            @id @default(cuid())
  groupId   String
  userId    String
  status    JoinRequestStatus @default(PENDING)
  expiresAt DateTime
  createdAt DateTime          @default(now())

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
  id           String        @id @default(cuid())
  slug         String        @unique
  title        String
  difficulty   Difficulty
  topics       String[]
  source       ProblemSource
  roadmapIndex Int           @unique
  leetcodeId   Int?
  codeforcesId String?

  dailyProblems DailyProblem[]
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum ProblemSource {
  LEETCODE
  CODEFORCES
}

model DailyProblem {
  id             String    @id @default(cuid())
  groupId        String
  problemId      String
  assignedDate   DateTime  @db.Date
  firstSolverId  String?
  firstSolveTime DateTime?

  group   Group     @relation(fields: [groupId], references: [id])
  problem Problem   @relation(fields: [problemId], references: [id])
  solves  UserSolve[]

  @@unique([groupId, assignedDate])
  @@index([assignedDate])
}

model UserSolve {
  id             String      @id @default(cuid())
  userId         String
  dailyProblemId String
  status         SolveStatus @default(PENDING_VERIFICATION)
  pointsEarned   Int         @default(0)
  isFirstInGroup Boolean     @default(false)
  verifiedAt     DateTime?
  createdAt      DateTime    @default(now())

  user         User         @relation(fields: [userId], references: [id])
  dailyProblem DailyProblem @relation(fields: [dailyProblemId], references: [id])

  @@unique([userId, dailyProblemId])
  @@index([userId])
}

enum SolveStatus {
  PENDING_VERIFICATION
  SOLVED
  PAUSED
  MISSED
  VERIFICATION_FAILED
}

model PointsHistory {
  id        String      @id @default(cuid())
  userId    String
  amount    Int
  reason    PointReason
  createdAt DateTime    @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
}

enum PointReason {
  DAILY_SOLVE
  FIRST_IN_GROUP
  STREAK_MULTIPLIER_BONUS
  MISSED_DAY
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

  user  User  @relation(fields: [userId], references: [id])
  badge Badge @relation(fields: [badgeId], references: [id])

  @@unique([userId, badgeId])
}

// Better Auth — do not modify
model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
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
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
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
| `pausesUsedThisMonth` resets on 1st of month | Trigger.dev cron job |
| Join requests expire after 1 day | `expiresAt` set on creation, hourly cron marks EXPIRED |
| Free users: `maxMembers = 30`, Pro groups: `maxMembers = 50` | Set on group creation based on creator's `isPro` |
| Streak breaks on `MISSED`, not on `VERIFICATION_FAILED` | Application logic in verify-submission job |

## Points Reference

| Action | Amount | `PointReason` |
|---|---|---|
| Solve daily problem | +10 | `DAILY_SOLVE` |
| First in group | +5 | `FIRST_IN_GROUP` |
| Miss (no pause used) | -3 | `MISSED_DAY` |
| Streak multiplier bonus (7d: +2, 30d: +5 per solve) | varies | `STREAK_MULTIPLIER_BONUS` |

## Post-MVP Tables

When community features ship, add:
- `Solution` — shared solutions for a daily problem
- `Comment` — comments on solutions
- `Vote` — upvotes on solutions
- `Resource` — community-submitted links
- `Notification` — in-app inbox entries
