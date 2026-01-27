# Notification System

## Authentication & Onboarding

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

- Daily (default)
- None (in-app only)

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

- Immediately
- Daily digest (default)
- Never

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
