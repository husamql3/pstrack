# ADR 0013 — Self-hosted transactional email via Stalwart (direct send, SMTP)

**Date:** 2026-07-11  
**Status:** Accepted

Supersedes the **Email** section of [ADR 0001](0001-self-hosted-vps-deployment.md).

---

## Context

PStrack sends only **transactional** email — magic-link sign-in, welcome, the daily-problem digest, group notifications (join approved/rejected/expired, removed, inactivity warning), and achievement mail (badge, streak, Pro unlocked). It never receives mail into mailboxes. Delivery has been handled by Resend.

The goal (per ADR 0001) is to **own the stack** — no managed vendors, and the user's explicit constraint is **self-hosted only, no smarthost relay**. Direct send is viable: outbound port 25 from the prod VPS (`45.141.57.84`) was confirmed open (real Gmail SMTP banner), and the operator permits custom rDNS. Magic-link deliverability is the dominant risk on a cold IP, partially mitigated because Google/GitHub OAuth are the primary sign-in paths.

ADR 0001 named **Postal**, but on inspection Postal was the wrong tool here: it's a full sending *platform* (needs MariaDB + RabbitMQ + a pre-boot `bootstrap`/`initialize` dance), which fights the box's modest RAM (3.8 GB) and does not fit Coolify's "paste a compose and deploy" model. For send-only transactional mail that weight buys nothing.

## Decision

Self-host **Stalwart** — a single-container mail server — and send **directly from the VPS IP** on port 25. No smarthost relay, no external vendor. Retire Resend after a phased cutover.

### Infrastructure

- New Coolify project **`mail`**, one Docker Compose resource: the Stalwart container + a persistent volume (embedded storage — no external DB or message queue). Web admin UI (queue, logs, DKIM, bounces) at `mail.pstrack.app` via the existing Traefik (`coolify-proxy`).
- Sends direct from `45.141.57.84` on port 25. **IPv6 egress must be disabled for SMTP** — the box has global IPv6 but no v6 rDNS/SPF, so delivering to AAAA-MX recipients (e.g. Gmail) over v6 would fail alignment. Pin Stalwart to IPv4-only outbound.
- The box has ~2.5 GB RAM free plus a 4 GB swapfile (added 2026-07-11); Stalwart (~150 MB) fits comfortably. Set a container memory limit anyway.

### App integration

- App → Stalwart over **authenticated SMTP submission** (`nodemailer`), port 587 (STARTTLS) or 465 (implicit TLS). Stalwart DKIM-signs and delivers to recipient MX on 25.
- **React Email templates are rendered to HTML + text in-app** (`@react-email/render`) inside `sendEmail()`. The `sendEmail({ from, to, subject, react, tag })` signature is unchanged apart from a required `tag` — no call-site churn.
- Each email carries an `EmailTag`, sent as an `X-Mail-Tag` header (filter/log in Stalwart) and used as the canary router key. The transporter is built lazily so the module stays import-safe (no eager env-dependent init).

### Sending identity & DNS (on `pstrack.app`)

Send **From the root domain** (`info@pstrack.app`, etc.) — this app is the only sender, so subdomain reputation-isolation buys little, and a new self-hosted DKIM selector coexists with the live Resend selector for a clean rollback.

```
mail.pstrack.app.          A      45.141.57.84
45.141.57.84 (PTR/rDNS)    →      mail.pstrack.app            (lowhosting panel)
pstrack.app.               TXT    "v=spf1 ip4:45.141.57.84 ~all"
<selector>._domainkey.pstrack.app.  TXT  (Stalwart-generated DKIM)
_dmarc.pstrack.app.        TXT    "v=DMARC1; p=none; adkim=r; aspf=r"
```

**DMARC** starts at `p=none` and ramps `none → quarantine → reject` over ~2–4 weeks, verified before each step by test-send (Gmail/Outlook/Yahoo + mail-tester + `Authentication-Results`). No `rua` — we don't run inbound mail, and manual verification suffices at this volume.

### Cutover — canary by email type

Routing is driven by two env vars: `EMAIL_TRANSPORT` (`smtp`|`resend`|`log`) and `EMAIL_RESEND_TAGS` (tags pinned to Resend during the canary).

1. **Phase 1** — digest + notifications → self-hosted SMTP; `magic-link` stays on Resend (`EMAIL_RESEND_TAGS=magic-link`). Watch placement, Stalwart's queue/bounce UI, blocklists, Google Postmaster Tools for a few days.
2. **Phase 2** — clear `EMAIL_RESEND_TAGS`; magic-link → SMTP. Verify again.
3. **Phase 3** — remove Resend: code path, `resend` dependency, `RESEND_API_KEY`, and its DNS records (`send.pstrack.app` SPF/MX, `resend._domainkey`).

### Daily-digest de-duplication

The digest loops per-recipient (concurrency-limited) and records sent addresses in a Redis set `digest:sent:{dateKey}` (2-day TTL), so a Trigger retry re-sends only what didn't go out — zero duplicates. The task throws (→ retry) only on total failure (`sent === 0 && failed > 0`); per-recipient failures amid partial success are captured to Sentry, not retried.

### Environments

- **Local dev + staging** use the `log` transport — render + log, never send (no mail credentials; staging can't spam real users from prod-like data). The magic-link log fallback stays.
- The SMTP path first executes in prod during the canary, gated by a manual test-send verification before the digest goes to all users.

### Deferred

- **List-Unsubscribe / one-click unsubscribe** — deferred; ~100× under Gmail's 5k/day bulk threshold and users already opt out at `/settings/notifications`.
- **Bounce/complaint automation into the app** — rely on Stalwart's queue/bounce handling for now; disabling a user's notifications from bounces is post-MVP.

## Alternatives considered

- **Postal** (ADR 0001's pick) — full sending platform; MariaDB + RabbitMQ + bootstrap/init don't fit the RAM budget or Coolify's compose model. Rejected as over-engineered for send-only.
- **Relay through a smarthost (SES/Postmark/Resend)** — safest deliverability, but keeps an external vendor; rejected by the self-hosted-only constraint.
- **Postfix + OpenDKIM / Maddy** — also single-container and lighter than Stalwart, but no admin UI. Stalwart wins for queue/bounce/DKIM observability during the deliverability-sensitive cutover.
- **SMTP vs an HTTP send API** — SMTP submission is the native interface for these single-container MTAs and keeps the app provider-agnostic.

## Consequences

- We own deliverability ops: rDNS, SPF/DKIM/DMARC, warmup, bounce handling, blocklist monitoring. Volume is low (~50/day) so the canary sequence *is* the warmup.
- **Hard prerequisites (host-side):** rDNS on `45.141.57.84` set to `mail.pstrack.app` (lowhosting panel; not doable over SSH). Outbound port 25 is already confirmed open.
- **Prod must set `EMAIL_TRANSPORT=smtp`** (+ `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`) explicitly — production skips env validation, so the zod default (`log`) does not apply; if unset, mail is silently logged, not sent.
- **Stalwart must be pinned to IPv4-only** for outbound SMTP.
