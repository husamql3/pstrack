# Notifications

## MVP: Email Only

All notifications sent via **Resend** using **React Email** templates. No in-app inbox in v3 — that ships post-MVP alongside community features.

## Events

### Auth & Onboarding

| Event | Trigger | Template |
|---|---|---|
| Welcome | User completes signup | `welcome.tsx` |
| Email verification | User registers | `verify-email.tsx` |
| Password reset | User requests reset | `reset-password.tsx` |
| Password changed | User changes password | `password-changed.tsx` |

### Groups

| Event | Recipient | Trigger | Template |
|---|---|---|---|
| New join request | Group admin | User requests to join public group | `join-request.tsx` |
| Join approved | User | Admin approves request | `join-approved.tsx` |
| Join rejected | User | Admin rejects request | `join-rejected.tsx` |
| Join request expired | User | Request not actioned in 1 day | `join-expired.tsx` |
| Removed from group | User | Admin removes user | `removed-from-group.tsx` |

### Daily Problem

| Event | Trigger | Template |
|---|---|---|
| Daily problem posted | Midnight, new problem assigned | `daily-problem.tsx` |
| Solve verified | Submission confirmed | `solve-verified.tsx` |
| Verification failed | No accepted submission found | `verification-failed.tsx` |

### Achievements

| Event | Trigger | Template |
|---|---|---|
| Streak milestone (7 / 30 / 100 days) | Streak threshold reached | `streak-milestone.tsx` |
| Badge earned | Badge condition met | `badge-earned.tsx` |

### System

| Event | Trigger | Template |
|---|---|---|
| Security alert | Login from new device | `security-alert.tsx` |
| Account deletion | User deletes account | `account-deletion.tsx` |

## User Preferences

Users can disable individual email categories from `/settings/notifications`:
- Daily problem digest
- Achievement emails
- Group activity emails

## Post-MVP: In-App Inbox

When community features ship, add:
- Upstash Realtime (WebSocket) for real-time delivery
- `Notification` table in DB for persistence
- Bell icon with unread count in nav
- New events: solution upvoted, comment received, new group member
