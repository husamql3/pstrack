# ADR 0003 — LeetPush Webhook Integration

**Date:** 2026-07-01  
**Status:** Accepted

---

## Context

PStrack's "Mark as Solved" flow requires users to manually navigate to the app and click a button after solving on LeetCode. LeetPush is a browser extension that detects accepted LeetCode submissions and can fire webhooks. Integrating the two eliminates the manual step entirely.

---

## Decisions

### Goal: Zero-click solve
LeetPush fires a webhook the moment a submission passes. PStrack auto-marks the solve without the user ever opening the app.

### Auth: Per-user webhook URL
Each user gets a unique webhook URL: `POST /api/v3/webhook/leetcode/<uuid>`. The UUID is the secret — no Authorization header required. Users can regenerate the UUID (revokes the old one) from the settings page.

### Race condition: Delayed Trigger.dev task
LeetPush fires within ~1–2s of a submission passing, but LeetCode's `recentAcSubmissions` API has an indexing delay (~30–120s). On webhook receipt, PStrack enqueues a Trigger.dev task with a **60-second delay** before hitting the LeetCode API.

### Slug validation at receipt
LeetPush sends the problem slug in its payload. The webhook handler checks the slug against today's assigned problem for the user's group **before** queuing the task. Mismatches (user solved a random problem) are dropped immediately — no wasted task invocations.

### User feedback: Pending celebration via SystemEvent
The existing `SOLVE_VERIFIED` SystemEvent is extended with an `acknowledged` boolean. When the delayed task completes and the solve is verified, the event is written with `acknowledged = false`. On the user's next dashboard load, the client checks for an unacknowledged `SOLVE_VERIFIED` event from today and fires the celebration modal, then marks it acknowledged. Silent default; no email.

### Scope: LeetCode-specific
Endpoint path and settings UI are explicitly named for LeetCode (`/webhook/leetcode/`, "LeetCode Integration"). A future Codeforces integration would be a separate entry with its own endpoint and payload shape.

### Settings placement: Integrations section
A new **Integrations** tab is added to `/settings` (alongside Notifications, Account, etc.). Shows the webhook URL with a copy button and a regenerate button. Keeps it separate from notification preferences — this is a connection to an external tool, not a preference.

---

## Other ideas captured (not scoped yet)

- **`GET /api/v3/problems/today/redirect`** — redirects the user straight to today's LeetCode problem URL. Bookmarkable; works as a LeetPush "open today's problem" action. Zero-friction complement to the webhook.
- **Streak-awareness reminder** — browser notification (via LeetPush or a future PStrack extension) prompting users who haven't solved today's PStrack problem when they open LeetCode. Higher value, higher effort.
- **Group solve overlay on LeetCode** — show "2/5 group members solved this" when a user opens today's assigned problem on LeetCode. Requires a PStrack browser extension.

---

## Consequences

- `SystemEvent` schema needs an `acknowledged: Boolean` field.
- New Prisma migration for `acknowledged`.
- New Trigger.dev task: `lc-webhook-verify` (delayed variant of `verify-submission`).
- New controller + DAO: `src/server/webhook/webhook.controller.ts`.
- New settings route: `/settings/integrations`.
- UUID stored on the `User` record (`lcWebhookToken: String?`), nullable until the user generates one.
