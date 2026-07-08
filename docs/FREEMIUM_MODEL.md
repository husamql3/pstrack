# Freemium Model

## Tiers

| | Free | Pro |
|---|---|---|
| Price | $0 | **$14 one-time** (sale: $9) |
| Groups joined | 1 | Up to 5 |
| Group capacity | 30 members | 50 members (Pro-created groups) |
| Create private groups | No | Yes |
| Pauses per month | 2 | 4 |
| Global leaderboard | No | Yes |
| Profile Pro badge | No | Yes |

## Payment

- Provider: **Polar**
- Model: one-time purchase (lifetime Pro access)
- Standard price: **$14**
- Sale price: **$9**
- Promo codes: supported natively in Polar dashboard
- Integration: **Better Auth Polar plugin** for checkout + webhook transport. NOTE: the plugin does **not** set `User.isPro` automatically — we handle that explicitly in the `onOrderPaid` webhook (`src/server/lib/pro.ts`). Requires `POLAR_WEBHOOK_SECRET`.

## How Pro Status Works

1. User clicks "Get Pro" → `authClient.checkout({ slug: "pstrack" })` → Polar checkout
2. On successful purchase, Polar fires the `order.paid` webhook
3. Our `onOrderPaid` handler maps the Polar customer → user (via `customer.externalId`, set to the user id on sign-up) and sets `isPro=true, proSource=POLAR_PURCHASE, proExpiresAt=null` (idempotent), then sends a confirmation email
4. User is redirected to `/success`, which refetches the session + `me` query so Pro reflects immediately
5. A refund fires `order.refunded` → Pro is revoked, but only when `proSource === POLAR_PURCHASE`

## Gating Logic

| Gate | Check |
|---|---|
| Join more than 1 group | `user.isPro && groupMemberships.length < 5` |
| Create private group | `user.isPro` |
| Use 3rd/4th pause | `user.isPro && pausesUsedThisMonth < 4` |
| View global leaderboard | `user.isPro` |

## Post-MVP Additions

- Custom roadmap for group (Pro admin perk)
- Detailed personal analytics dashboard (Pro perk)
