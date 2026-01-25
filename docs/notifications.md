# Notification System

## Notification Channels

### 1. Email (via Resend)

- **Transactional emails** for critical actions
- **Digest emails** for daily/weekly summaries
- Built with **React Email** templates

### 2. In-App Notifications

- **Bell icon** in header with unread count
- **Notification panel** (slide-out)
- Real-time updates via **Server-Sent Events (SSE)**

### 3. Browser Push (Future)

- Optional for premium users
- Requires service worker

---

## Notification Types & Triggers

### Authentication & Onboarding

| Event | Channel | Sent When | Template |
|-------|---------|-----------|----------|
| **Welcome Email** | Email | User completes signup | `welcome.tsx` |
| **Email Verification** | Email | User registers | `verify-email.tsx` |
| **Group Join Approved** | Email + In-App | Admin approves join request | `group-approved.tsx` |
| **Group Join Rejected** | Email + In-App | Admin rejects join request | `group-rejected.tsx` |

---

### Daily Problem

| Event | Channel | Sent When | Template |
|-------|---------|-----------|----------|
| **Daily Problem Posted** | Email (digest) | New problem assigned | `daily-problem.tsx` |
| **Reminder: Unsolved** | Email | 6 hours before deadline | `problem-reminder.tsx` |
| **Streak at Risk** | Email + In-App | 2 hours before deadline | `streak-warning.tsx` |
| **Problem Verified** | In-App | Submission verified | N/A (in-app only) |
| **Verification Failed** | In-App | Submission not found | N/A |

**Email Digest Options** (User Settings):

- ✅ Daily (default)
- ⬜ None (in-app only)

---

### Points & Achievements

| Event | Channel | Sent When | Template |
|-------|---------|-----------|----------|
| **First Solve in Group** | In-App | User solves before anyone else | N/A |
| **First Solve on Platform** | In-App | User solves globally first | N/A |
| **Streak Milestone** | Email + In-App | 7/14/30/100 day streak | `streak-milestone.tsx` |
| **Badge Earned** | In-App | New badge unlocked | N/A |
| **Leaderboard Rank** | Email (weekly) | User in top 10 (weekly recap) | `weekly-recap.tsx` |

---

### Community Interactions

| Event | Channel | Sent When | Template |
|-------|---------|-----------|----------|
| **Solution Upvoted** | In-App | Someone upvotes your solution | N/A |
| **Comment on Solution** | Email + In-App | Someone comments on your solution | `new-comment.tsx` |
| **Reply to Comment** | Email + In-App | Someone replies to your comment | `comment-reply.tsx` |
| **Resource Approved** | Email + In-App | Admin approves submitted resource | `resource-approved.tsx` |
| **Resource Rejected** | Email + In-App | Admin rejects resource | `resource-rejected.tsx` |

**Email Frequency Options**:

- ⬜ Immediately
- ✅ Daily digest (default)
- ⬜ Never

---

### Pause & Moderation

| Event | Channel | Sent When | Template |
|-------|---------|-----------|----------|
| **Pause Approved** | In-App | Admin approves pause request | N/A |
| **Pause Rejected** | Email + In-App | Admin rejects pause request | `pause-rejected.tsx` |
| **Suspension Warning** | Email + In-App | 2 unexcused misses (1 away from suspension) | `suspension-warning.tsx` |
| **Account Suspended** | Email + In-App | 3rd unexcused miss | `suspended.tsx` |
| **Suspension Lifted** | Email + In-App | 7-day suspension ends | `suspension-lifted.tsx` |
| **Content Removed** | Email + In-App | Spam/violation flagged | `content-removed.tsx` |

---

### Group Management

| Event | Channel | Sent When | Template |
|-------|---------|-----------|----------|
| **New Join Request** | Email (admin) | User requests to join private group | `join-request.tsx` |
| **Group Change Approved** | Email + In-App | Admin approves group change | `group-change-approved.tsx` |
| **Removed from Group** | Email + In-App | Admin removes user from group | `removed-from-group.tsx` |
| **Group Invitation** | Email | User receives invite link | `group-invite.tsx` |

---

### System Notifications

| Event | Channel | Sent When | Template |
|-------|---------|-----------|----------|
| **Maintenance Scheduled** | Email | 24 hours before maintenance | `maintenance.tsx` |
| **Password Changed** | Email | User changes password | `password-changed.tsx` |
| **Security Alert** | Email | Login from new device/location | `security-alert.tsx` |
| **Account Deletion** | Email | User requests account deletion | `account-deletion.tsx` |

---

## Notification Preferences

### User Settings Panel

```typescript
interface NotificationPreferences {
  email: {
    dailyProblem: boolean;          // Default: true
    communityDigest: 'immediate' | 'daily' | 'never'; // Default: daily
    streakWarnings: boolean;        // Default: true
    weeklyRecap: boolean;           // Default: true
    moderation: boolean;            // Default: true (cannot disable)
    security: boolean;              // Default: true (cannot disable)
  };
  inApp: {
    enabled: boolean;               // Default: true
    playSound: boolean;             // Default: false
  };
  push: {
    enabled: boolean;               // Default: false (premium only)
  };
}
```

---

## Email Templates (React Email)

### Template Structure

```tsx
// emails/daily-problem.tsx
import { Button, Html, Text } from '@react-email/components';

export default function DailyProblemEmail({
  username,
  problemTitle,
  problemUrl,
  groupName,
}: {
  username: string;
  problemTitle: string;
  problemUrl: string;
  groupName: string;
}) {
  return (
    <Html>
      <Text>Hi {username},</Text>
      <Text>
        Today's problem for {groupName} is ready:
      </Text>
      <Text style={{ fontWeight: 'bold' }}>{problemTitle}</Text>
      <Button href={problemUrl}>
        Solve Now
      </Button>
    </Html>
  );
}
```

### Email Sending (via Trigger.dev)

```typescript
// jobs/send-daily-problem-emails.ts
import { task } from "@trigger.dev/sdk/v3";
import { Resend } from 'resend';
import DailyProblemEmail from '../emails/daily-problem';

export const sendDailyProblemEmails = task({
  id: "send-daily-problem-emails",
  run: async (payload: { groupId: string }) => {
    const users = await db.query.users.findMany({
      where: eq(users.groupId, payload.groupId),
      with: { notificationPreferences: true }
    });

    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const user of users) {
      if (!user.notificationPreferences.email.dailyProblem) continue;

      await resend.emails.send({
        from: 'pstrack <noreply@pstrack.tech>',
        to: user.email,
        subject: `Today's Problem: ${problem.title}`,
        react: DailyProblemEmail({
          username: user.username,
          problemTitle: problem.title,
          problemUrl: problem.url,
          groupName: group.name,
        }),
      });
    }
  },
});
```

---

## In-App Notification System

### Schema

```typescript
// db/schema/notifications.ts
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  type: text('type').notNull(), // 'solve_verified', 'comment', etc.
  title: text('title').notNull(),
  message: text('message'),
  link: text('link'), // URL to related resource
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### API Endpoints

```typescript
// routes/notifications.ts
app.get('/api/notifications', async (c) => {
  const userId = c.get('userId');
  
  const notifications = await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: desc(notifications.createdAt),
    limit: 50,
  });

  return c.json(notifications);
});

app.patch('/api/notifications/:id/read', async (c) => {
  const { id } = c.req.param();
  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, parseInt(id)));
  
  return c.json({ success: true });
});
```

### Real-Time Updates (SSE)

```typescript
// routes/notifications-stream.ts
app.get('/api/notifications/stream', async (c) => {
  const userId = c.get('userId');

  return c.streamText(async (stream) => {
    // Send initial notifications
    const initial = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      )
    });
    
    await stream.write(`data: ${JSON.stringify(initial)}

`);

    // Subscribe to Redis pub/sub for new notifications
    const subscriber = redis.subscribe(`notifications:${userId}`);
    
    for await (const message of subscriber) {
      await stream.write(`data: ${message}

`);
    }
  });
});
```

---

## Notification Batching (Performance)

### Daily Digest Job

```typescript
// jobs/send-daily-digest.ts
export const sendDailyDigest = task({
  id: "send-daily-digest",
  cron: "0 18 * * *", // 6 PM daily
  run: async () => {
    const users = await db.query.users.findMany({
      where: eq(users.notificationPreferences.email.communityDigest, 'daily')
    });

    for (const user of users) {
      const activities = await getUnreadActivities(user.id);
      
      if (activities.length === 0) continue;

      await resend.emails.send({
        from: 'pstrack <digest@pstrack.tech>',
        to: user.email,
        subject: `You have ${activities.length} new updates`,
        react: DailyDigestEmail({ activities }),
      });
    }
  },
});
```

---

## Rate Limiting

### Prevent Spam

- Max 5 in-app notifications per user per minute
- Max 10 emails per user per day
- Implemented via Upstash Redis:

```typescript
const canSendNotification = await ratelimit({
  key: `notifications:${userId}`,
  limit: 5,
  window: '1m',
});

if (!canSendNotification) {
  // Queue for later
  await redis.lpush(`notification_queue:${userId}`, notification);
}
```

---

## Analytics (PostHog)

Track notification engagement:

```typescript
posthog.capture({
  distinctId: userId,
  event: 'notification_sent',
  properties: {
    type: 'daily_problem',
    channel: 'email',
  },
});

posthog.capture({
  distinct
