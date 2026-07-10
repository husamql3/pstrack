# ADR 0013 — Self-hosted transactional email via Postal (direct send)

**Date:** 2026-07-11  
**Status:** Accepted

Supersedes the **Email** section of [ADR 0001](0001-self-hosted-vps-deployment.md).

---

## Context

PStrack sends only **transactional** email — magic-link sign-in, welcome, the daily-problem digest, group notifications (join approved/rejected/expired, removed, inactivity warning), and achievement mail (badge, streak, Pro unlocked). It never receives mail into mailboxes. Delivery has been handled by Resend.

The goal (per ADR 0001) is to **own the stack** — no managed vendors. ADR 0001 named Postal as the replacement but predated two facts that shape the design:

1. Production is not on Hetzner — it's a lowhosting.org VPS at `45.141.57.84` (AS212508, AMD64), whose operator permits outbound port 25 and custom rDNS.
2. The magic-link email **is** the login. On a cold self-hosted IP, deliverability is the dominant risk. It is partially mitigated because Google/GitHub OAuth are the primary sign-in paths (magic-link is one of three).

## Decision

Self-host **Postal** and send **directly from the VPS IP** — no smarthost relay, no external vendor. Retire Resend after a phased cutover.

### Infrastructure

- New Coolify project **`mail`**, one **self-contained Docker Compose** resource: Postal (web + worker + SMTP) + MariaDB + RabbitMQ. Coolify owns the domain (`postal.pstrack.app`, TLS), volumes, and env. Initialised once via Coolify's terminal (`postal initialize`, `postal make-user`), which also generates the DKIM key.
- Sends direct from `45.141.57.84` on port 25 (in + out). Port 25 inbound is required for return-path bounce capture.

### App integration

- App → Postal over the **HTTP API** (`POST /api/v1/send/message`, `X-Server-API-Key`). Chosen over SMTP for message-ID correlation with Postal's UI, per-email `tag`, and clean per-recipient results — SMTP's provider-portability isn't valuable once committed to self-hosted Postal.
- **React Email templates are rendered to HTML + text in-app** (`@react-email/render`) inside `sendEmail()`; Postal receives `html_body`/`plain_body`. The `sendEmail({ from, to, subject, react, tag })` signature is unchanged apart from a required `tag` — no call-site churn.
- Every email carries an `EmailTag` (surfaces in Postal's UI; also the canary router key). The lazy-client pattern in `src/server/lib/email.ts` is preserved so the module stays import-safe (no eager env-dependent init).

### Sending identity & DNS (on `pstrack.app`)

Send **From the root domain** (`info@pstrack.app`, etc.) — this app is the only sender, so subdomain reputation-isolation buys little, and a new Postal DKIM selector coexists with the live Resend selector for a clean rollback.

```
mail.pstrack.app.          A      45.141.57.84
45.141.57.84 (PTR/rDNS)    →      mail.pstrack.app            (lowhosting)
pstrack.app.               TXT    "v=spf1 ip4:45.141.57.84 ~all"
<postal-sel>._domainkey.pstrack.app.  TXT  (Postal-generated DKIM)
psrp.pstrack.app.          CNAME/MX  (Postal return-path → bounces)
_dmarc.pstrack.app.        TXT    "v=DMARC1; p=none; adkim=r; aspf=r"
```

**DMARC** starts at `p=none` and ramps `none → quarantine → reject` over ~2–4 weeks, verified before each step by test-send (Gmail/Outlook/Yahoo + mail-tester + `Authentication-Results`). No `rua` — we don't run inbound mail, and manual verification suffices at this volume.

### Cutover — canary by email type

Routing is driven by two env vars: `EMAIL_TRANSPORT` (default provider) and `EMAIL_RESEND_TAGS` (tags pinned to Resend during the canary).

1. **Phase 1** — digest + notifications → Postal; `magic-link` stays on Resend (`EMAIL_RESEND_TAGS=magic-link`). Watch placement, Postal bounce dashboard, blocklists, Google Postmaster Tools for a few days.
2. **Phase 2** — clear `EMAIL_RESEND_TAGS`; magic-link → Postal. Verify again.
3. **Phase 3** — remove Resend: code path, `resend` dependency, `RESEND_API_KEY`, and its DNS records (`send.pstrack.app` SPF/MX, `resend._domainkey`).

### Daily-digest de-duplication

Postal has no idempotency key. The digest loops per-recipient (concurrency-limited) and records sent addresses in a Redis set `digest:sent:{dateKey}` (2-day TTL). A Trigger retry re-sends only what didn't go out — zero duplicates. The task throws (→ retry) only on total failure (`sent === 0 && failed > 0`); per-recipient failures amid partial success are captured to Sentry, not retried.

### Environments

- **Local dev + staging** use the `log` transport — render + log, never send (no mail credentials needed; staging can't spam real users from prod-like data). The magic-link log fallback stays.
- The Postal path first executes in prod during the canary, gated by a manual test-send verification before the digest goes to all users.

### Deferred

- **List-Unsubscribe / one-click unsubscribe** — deferred; ~100× under Gmail's 5k/day bulk threshold and users already opt out at `/settings/notifications`. Revisit before scaling past a few thousand daily digests.
- **Bounce/complaint webhooks into the app** — rely on Postal's built-in suppression list for now; wiring bounces back to disable a user's notifications is post-MVP.

## Alternatives considered

- **Relay through a smarthost (SES/Postmark/Resend)** — safest deliverability, but keeps an external vendor; rejected in favour of full ownership. Postal keeps this reversible (a config change) if a cold-IP reputation problem forces it.
- **Dedicated mail VPS** — better reputation isolation, but the current host permits port 25 + rDNS, so co-location (ADR 0001's intent) stands.
- **SMTP transport (nodemailer)** — provider-agnostic but less observable; not worth it for a committed self-hosted Postal.
- **Lighter MTA (Maddy/Stalwart)** — smaller footprint, but no message-log/suppression UI; Postal's operability wins.

## Consequences

- We own deliverability ops: rDNS, SPF/DKIM/DMARC, warmup, bounce handling, blocklist monitoring. Volume is low (~50/day) so the canary sequence *is* the warmup.
- **Hard prerequisites (host-side):** outbound port 25 enabled and rDNS set to `mail.pstrack.app` on `45.141.57.84`. The plan cannot deliver without both.
- **Prod must set `EMAIL_TRANSPORT=postal`** (+ `POSTAL_API_URL`, `POSTAL_API_KEY`) explicitly — production skips env validation, so the zod default (`log`) does not apply; if unset, mail is silently logged, not sent.
- MariaDB + RabbitMQ add ~0.5–1 GB RAM on the shared VPS.
