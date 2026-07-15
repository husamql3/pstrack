# ADR 0013 — Self-hosted transactional email via Stalwart (SMTP)

**Date:** 2026-07-13  
**Status:** Accepted

Adds a self-hosted sending option alongside Resend. Supersedes the **Email** section of [ADR 0001](0001-self-hosted-vps-deployment.md) (which named Postal).

---

## Context

PStrack sends only **transactional** email — magic-link sign-in, welcome, the daily-problem digest, group notifications, and achievement mail. The project's direction is to **own the stack** (no managed vendors where practical). Resend works, but we want the option to send from our own infrastructure.

ADR 0001 named **Postal**; on inspection it was too heavy for the prod box (MariaDB + RabbitMQ + a pre-boot bootstrap flow) and didn't fit Coolify's paste-a-compose model. Direct send is viable: outbound port 25 from the prod VPS (`45.141.57.84`, lowhosting.org — see [[project_prod_host_lowhosting]]) is confirmed open, and rDNS is set to `mail.pstrack.app`.

## Decision

Run **Stalwart** — a single-container mail server — on the Coolify box, and add an **`smtp`** transport to the app. Keep it a **config switch**, not a hard cutover: `EMAIL_TRANSPORT` selects `resend` (default) | `smtp` | `log`.

### App

- `EMAIL_TRANSPORT` gains `"smtp"`. `sendEmail(payload)` keeps its signature (Resend's `CreateEmailOptions`); when transport is `smtp`, it renders the `react` template to HTML + text in-app (`@react-email/render`) and submits via **nodemailer** to Stalwart. `buildEnv` validates that `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are present for `smtp` (the same fail-fast pattern as the Resend/log rules, #281).
- The daily digest (`jobs.service.ts`) now sends **per-recipient through `sendEmail`** rather than `resend.batch.send`, so it works under any transport. Per-recipient failures are captured to Sentry and never fail the batch.
- The elaborate per-tag "canary" routing from the earlier draft was dropped as gold-plating — a single `EMAIL_TRANSPORT` switch is enough.

### Server / DNS

- New Coolify project **`mail`**, one Docker Compose resource: the Stalwart container + a volume. Admin UI reachable via SSH tunnel (Coolify's Traefik can't auto-pick the port on Stalwart's multi-port image — a non-blocking convenience issue).
- Sends **direct from `45.141.57.84`** on port 25, **IPv4-only** (the box has IPv6 but no v6 rDNS/SPF; container egress is IPv4 NAT, so this is naturally satisfied).
- DNS on `pstrack.app`: `mail` A → the IP (DNS-only, not Cloudflare-proxied), SPF `v=spf1 ip4:45.141.57.84 ~all`, DKIM (Stalwart-generated selectors), DMARC `p=none` → ramp. rDNS `45.141.57.84 → mail.pstrack.app`.

### Cutover

No hard cutover. Prod stays on Resend until Stalwart is verified (test-send + SPF/DKIM/DMARC pass), then flip `EMAIL_TRANSPORT=smtp` (+ `SMTP_*`) in Coolify. `log` remains the dev/staging transport.

## Consequences

- **Prod must set `EMAIL_TRANSPORT=smtp` + `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`** to use self-hosted send; otherwise it stays on Resend. Validation fails fast on a misconfigured combination.
- We own deliverability ops (rDNS, SPF/DKIM/DMARC, warmup, blocklist monitoring). Volume is low (~50/day).
- Resend is retained as the default/fallback; it can be removed later once SMTP is proven.
