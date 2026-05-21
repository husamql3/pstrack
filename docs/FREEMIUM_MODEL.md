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
- Integration: **Better Auth Polar plugin** — Pro status is tied directly to the auth session, no manual webhook handling required

## How Pro Status Works

1. User clicks "Upgrade to Pro" → redirected to Polar checkout
2. On successful purchase, Polar fires webhook → Better Auth Polar plugin handles it
3. `User.isPro` set to `true`
4. Next session refresh picks up the updated Pro status automatically

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
