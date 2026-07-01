# ADR 0001 — husam-bot: Telegram Bot for Admin Notifications

**Date:** 2026-07-01  
**Status:** Accepted

---

## Context

Admin notifications across PStrack and ql3.dev are currently delivered via email (Resend). This has two problems: email is async and easy to miss, and there is no single place to monitor all personal projects and infrastructure together.

The goal is a unified, real-time notification hub that covers:

1. **PStrack** — all admin-facing events (replacing current admin emails)
2. **ql3.dev stats** — daily digest + milestone alerts for GitHub, npm, LeetPush, PStrack
3. **Infrastructure** — Vercel deployments, uptime, Trigger.dev jobs, Sentry errors, Coolify (VPS + Docker containers)

---

## Decision

Build a standalone Telegram bot project — **`husam-bot`** — deployed on Vercel, using grammy with its Vercel adapter. The bot sends to a **single private Telegram chat** (DM, private group, or private channel). All signal types are separated by emoji prefix + bold category header in the message body.

### Repo & Stack

| Concern | Choice |
|---|---|
| Repo | New GitHub repo: `husamql3/husam-bot` |
| Runtime | Bun (local dev) / Vercel Edge Runtime (deployed) |
| Router | [Hono](https://hono.dev) — Edge-native, shared auth middleware |
| Framework | [grammy](https://grammy.dev) + `@grammyjs/adapter-vercel` |
| Deployment | Vercel (webhook-based, no persistent process) |
| Telegram destination | Single private chat (`TELEGRAM_CHAT_ID`) |
| Metric storage | Upstash Redis (HTTP-based, Edge-compatible) |
| Message format | HTML parse mode |

### Message Formatting

All messages use HTML parse mode. Each message carries an emoji prefix and bold category header for scannability in a single-stream chat:

```
🧑‍💻 <b>PStrack — New User</b>
husam@example.com joined at 14:32 UTC

🚨 <b>Error — Sentry</b>
NullPointerException in /api/v3/groups · 3 occurrences

📦 <b>Infra — Vercel Deploy</b>
pstrack · Production · ✅ Ready
```

Category prefixes:

| Prefix | Category |
|---|---|
| 🧑‍💻 | PStrack events |
| 📊 | ql3.dev stats digest |
| 🏆 | Milestone alerts |
| 📦 | Infra (Vercel, Coolify, uptime) |
| 🚨 | Errors (Sentry) |
| 🤖 | Bot health / command responses |

### Notification Sources

#### PStrack → husam-bot (HTTP POST)

PStrack replaces all admin email calls with a fire-and-forget HTTP POST to `https://husam-bot.vercel.app/api/notify`, authenticated with a shared bearer token (`BOT_NOTIFY_SECRET`). No retries — if the bot is unreachable, the notification is silently dropped.

Events are validated with strict **Zod schemas** per event type on the bot side. Unknown events fall through to a generic formatted message rather than a 400.

| Event | Zod type | Trigger |
|---|---|---|
| New group join request | `JoinRequested` | `groupNotifications.joinRequested` |
| New feedback submitted | `FeedbackSubmitted` | `feedbackDao.submit` |
| New user signup | `NewUser` | auth webhook / onboarding complete |
| New Pro purchase | `ProPurchase` | Polar webhook |
| Trigger.dev job failure | `JobFailed` | Trigger.dev webhook |
| Daily solve digest | `DailySolveDigest` | 00:05 UTC cron (after assign-daily-problem) |

#### ql3.dev Stats (bot-side cron)

The bot runs a Vercel cron at `0 9 * * *` (9am UTC). It fetches:

- GitHub: followers, public repos, total stars, total forks (`api.github.com`)
- db-studio: weekly / monthly / yearly npm downloads (`api.npmjs.org`)
- LeetPush: Chrome extension users + stars
- PStrack: user count (`pstrack.app/api/v3/users/count`) + stars

**Daily digest** — all metrics + delta vs previous day's snapshot (stored in Upstash Redis).

**Milestone alerts** — fires immediately when a value crosses a round number (100 → 500 → 1k → 5k → 10k) for: PStrack users, db-studio monthly downloads, LeetPush users, GitHub total stars.

#### Webhooks (external services → husam-bot)

| Source | Event | Webhook URL |
|---|---|---|
| Vercel | Deployment success / failure | `/webhooks/vercel` |
| Sentry | New issue / error spike | `/webhooks/sentry` |
| Coolify | Deploy event, container crash, service down | `/webhooks/coolify` |
| Uptime | Site down / recovered (pstrack.app, ql3.dev) | `/webhooks/uptime` |

Uptime monitoring: UptimeRobot free tier pointing at `/health` endpoints, webhook delivery to husam-bot.

### Bot Commands

Commands are handled via the Telegram webhook (Telegram → `/api/telegram`). The bot accepts commands from any message in the configured chat and replies in the same thread.

| Command | Response | Data source |
|---|---|---|
| `/stats` | All ql3.dev metrics snapshot | Live fetch from GitHub + npm APIs |
| `/pstrack` | Active users, solves today, pending join requests | PStrack `/api/v3/admin/*` |
| `/health` | Ping pstrack.app, ql3.dev, Coolify services | HTTP HEAD to each endpoint |
| `/feedbacks` | Last 5 unreviewed feedbacks with truncated text | PStrack `/api/v3/feedbacks` |
| `/db-studio` | npm downloads (weekly/monthly/yearly) + stars | npm + GitHub APIs |

### Authentication & Security

- **PStrack → bot**: `Authorization: Bearer $BOT_NOTIFY_SECRET` header. Bot rejects anything else with 401.
- **Telegram → bot**: grammy validates the request comes from Telegram using the bot token.
- **External webhooks** (Vercel, Sentry, Coolify): each has its own secret header validated per-provider at `/webhooks/:provider`.
- **Commands**: bot only responds to messages in the configured chat (validated by `TELEGRAM_CHAT_ID`).

Auth is enforced via shared Hono middleware applied to all routes that require it.

### Environment Variables

```
TELEGRAM_BOT_TOKEN=          # bot token from @BotFather
TELEGRAM_CHAT_ID=            # chat ID to send all notifications to

BOT_NOTIFY_SECRET=           # shared with PStrack

UPSTASH_REDIS_REST_URL=      # for metric snapshots + milestone tracking
UPSTASH_REDIS_REST_TOKEN=

VERCEL_WEBHOOK_SECRET=
SENTRY_WEBHOOK_SECRET=
COOLIFY_WEBHOOK_SECRET=

GITHUB_API_TOKEN=            # for stats fetching (rate limit headroom)
PSTRACK_API_URL=             # https://pstrack.app/api/v3
PSTRACK_ADMIN_TOKEN=         # for /pstrack and /feedbacks commands
```

### PStrack Changes

`groups.notifications.ts` and `problems.notifications.ts` get a thin `notifyAdmin()` helper:

```ts
// src/server/lib/bot.ts
export const notifyAdmin = (event: string, payload: Record<string, unknown>) => {
  fetch(`${env.BOT_URL}/api/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.BOT_NOTIFY_SECRET}`,
    },
    body: JSON.stringify({ event, payload }),
  }).catch(() => {})
}
```

All existing `sendEmail(...)` calls to site admins in `groups.notifications.ts` are replaced with `notifyAdmin(...)`. User-facing emails (join approved, join rejected, streak milestone, badge earned, etc.) are **not touched** — those go to end users, not the admin.

### Build Order

1. Core bot — Hono + grammy setup, Telegram webhook, chat ID guard
2. `/api/notify` — PStrack events with Zod schemas
3. Stats cron — daily ql3.dev digest + Upstash snapshots + milestone alerts
4. Bot commands — `/stats`, `/pstrack`, `/health`, `/feedbacks`, `/db-studio`
5. External webhooks — Vercel, Sentry, Coolify, UptimeRobot (incremental)

### Local Development

Webhook handlers are tested via direct HTTP (`curl` / Hurl). No tunnel required for local development. End-to-end Telegram delivery is verified on Vercel preview branch deployments.

---

## Consequences

**Good:**
- Single place for all personal project signals — no context-switching between email, Sentry, Vercel dashboard, Coolify
- Telegram delivers on mobile instantly; email does not
- Single chat with formatted messages is simpler to build and operate than forum topics for personal-project traffic volume
- Bot is fully free (Telegram Bot API, Vercel hobby tier, UptimeRobot free, Upstash free tier)
- Hono + grammy + Vercel adapter is minimal boilerplate; webhook registration happens on first deploy
- PStrack admin email dependency (Resend for admin notifications) is eliminated

**Trade-offs:**
- Vercel cron minimum interval is 1 minute (hobby) — the 9am stats digest requires a cron entry in `vercel.json`
- No persistent process means the bot cannot use long-polling; webhook URL must be publicly reachable (Vercel handles this)
- Milestone detection requires persisting previous metric snapshots in Upstash Redis
- PStrack must have `BOT_URL` and `BOT_NOTIFY_SECRET` env vars; local dev is a no-op when `BOT_URL` is unset
- All notification types share one chat stream — managed via emoji prefix and bold headers rather than channel separation

---

## Alternatives Considered

- **Admin emails (status quo)** — missed on mobile, no unified view, no commands
- **Slack** — free tier message limits and 90-day history cap; Telegram is unlimited and free
- **Telegram forum topics** — more visual separation but 5 extra env vars, `message_thread_id` on every send, and forum mode group setup; overkill for personal-project traffic
- **Coolify on VPS (polling bot)** — simpler process model but adds infra concern to an already-infra tool; Vercel keeps it zero-ops
- **Multiple bots per app** — unnecessary complexity; one bot is cleaner
- **Elysia router** — Bun-native, not compatible with Vercel Edge Runtime; replaced with Hono
- **Vercel KV / Blob for snapshots** — Upstash Redis chosen for its HTTP-based Edge-compatible client and free tier
