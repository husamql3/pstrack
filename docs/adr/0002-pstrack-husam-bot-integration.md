# ADR 0002 — PStrack: husam-bot Integration

**Date:** 2026-07-01  
**Status:** Accepted  
**For:** PStrack agent — implement these changes in the PStrack codebase

---

## Context

husam-bot (`https://husam-bot.vercel.app`) is a Telegram notification bot that replaces all admin-facing emails in PStrack. This ADR describes the exact changes needed in PStrack to wire up the integration.

**Do not touch user-facing emails** (join approved, join rejected, streak milestones, badge earned, etc.). Only admin notification emails are replaced.

---

## Changes Required

### 1. Environment Variables

Add to PStrack's `.env` (and Vercel project env vars):

```
BOT_URL=https://husam-bot.vercel.app
BOT_NOTIFY_SECRET=<same value as husam-bot's BOT_NOTIFY_SECRET>
```

`BOT_URL` should be optional in the env schema — when absent, `notifyAdmin()` is a no-op. This keeps local dev working without the bot running.

---

### 2. New Helper: `src/server/lib/bot.ts`

Create this file:

```ts
// src/server/lib/bot.ts
import { env } from '@/server/env'

export const notifyAdmin = (event: string, payload: Record<string, unknown>): void => {
  if (!env.BOT_URL) return
  fetch(`${env.BOT_URL}/api/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.BOT_NOTIFY_SECRET}`,
    },
    body: JSON.stringify({ event, payload }),
  }).catch(() => {})
}
```

- Fire-and-forget (`catch(() => {})`) — never awaited, never throws
- No-op when `BOT_URL` is unset

---

### 3. Event Payloads

The bot validates these exact shapes with Zod. PStrack must send them exactly as specified.

#### `join.requested`
```ts
notifyAdmin('join.requested', {
  groupName: string,      // name of the group
  userEmail: string,      // requester's email
  userName: string,       // optional: requester's display name
  requestedAt: string,    // ISO 8601 timestamp, e.g. new Date().toISOString()
})
```

#### `feedback.submitted`
```ts
notifyAdmin('feedback.submitted', {
  userEmail: string,      // submitter's email
  text: string,           // full feedback text
  submittedAt: string,    // ISO 8601 timestamp
})
```

#### `user.created`
```ts
notifyAdmin('user.created', {
  email: string,          // new user's email
  name: string,           // optional: display name
  createdAt: string,      // ISO 8601 timestamp
})
```

#### `purchase.pro`
```ts
notifyAdmin('purchase.pro', {
  email: string,          // buyer's email
  plan: string,           // plan name, e.g. "Pro Monthly"
  amount: number,         // optional: amount in cents, e.g. 999
  purchasedAt: string,    // ISO 8601 timestamp
})
```

#### `job.failed`
```ts
notifyAdmin('job.failed', {
  jobName: string,        // Trigger.dev job name
  error: string,          // error message or stack trace
  failedAt: string,       // ISO 8601 timestamp
})
```

#### `digest.daily`
```ts
notifyAdmin('digest.daily', {
  date: string,           // YYYY-MM-DD, e.g. "2026-07-01"
  totalSolves: number,    // total solves across all users today
  activeUsers: number,    // users who solved at least one problem today
  newUsers: number,       // optional: new signups today
})
```

---

### 4. Replace Admin Email Calls

#### `groups.notifications.ts` (or equivalent)

Find every `sendEmail(...)` call that goes to the **site admin** (not to the user) and replace with `notifyAdmin(...)`.

Likely calls to replace:
- Admin notified of a new join request → `notifyAdmin('join.requested', ...)`
- Any admin-facing group event notifications

Do **not** replace:
- `sendEmail` to the user whose request was approved/rejected
- `sendEmail` to users for any user-facing notification

#### `feedbackDao.ts` (or equivalent)

On feedback submission, add (do not replace any existing logic):

```ts
notifyAdmin('feedback.submitted', {
  userEmail: feedback.userEmail,
  text: feedback.text,
  submittedAt: new Date().toISOString(),
})
```

#### Auth webhook / onboarding complete handler

When a new user completes signup:

```ts
notifyAdmin('user.created', {
  email: user.email,
  name: user.name ?? undefined,
  createdAt: new Date().toISOString(),
})
```

#### Polar webhook handler

On successful Pro purchase:

```ts
notifyAdmin('purchase.pro', {
  email: customer.email,
  plan: product.name,
  amount: order.amount,             // in cents, optional
  purchasedAt: new Date().toISOString(),
})
```

#### Trigger.dev failure handler

On job failure:

```ts
notifyAdmin('job.failed', {
  jobName: job.name,
  error: error.message,
  failedAt: new Date().toISOString(),
})
```

#### Daily solve digest cron (00:05 UTC, after `assign-daily-problem`)

Add to the existing cron job that runs after daily problem assignment:

```ts
notifyAdmin('digest.daily', {
  date: new Date().toISOString().slice(0, 10),
  totalSolves: stats.totalSolves,
  activeUsers: stats.activeUsers,
  newUsers: stats.newUsers ?? undefined,
})
```

---

## Consequences

- PStrack no longer sends admin notification emails via Resend for the events above
- `BOT_URL` absent → `notifyAdmin` is a no-op → safe for local dev with no husam-bot running
- All calls are fire-and-forget; if husam-bot is unreachable the event is silently dropped
- User-facing emails (Resend) are untouched
