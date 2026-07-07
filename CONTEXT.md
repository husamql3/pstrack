# PStrack

Collaborative LeetCode progress tracking. Users solve daily problems in groups, earn points and streaks, and can unlock **Pro** for higher limits and premium features.

## Language

### Pro & entitlements

**Pro**:
An account entitlement unlocking higher limits and premium features. Permanent once obtained (`proExpiresAt = null`) — the one exception is an admin grant, which can be time-boxed and auto-expires.
_Avoid_: premium (the word "premium" is reserved — see below), paid tier, subscription (Pro is a one-time lifetime unlock, not recurring).

**Pro source**:
How an account became Pro. One of: `POLAR_PURCHASE` (bought it), `POINTS_THRESHOLD` (crossed 3,000 points), `ADMIN_GRANT` (granted directly, optionally time-boxed), `INVITATION` (redeemed a Pro invitation — always lifetime).

**Pro invitation**:
An **admin-issued**, email-targeted, single-use claim link that grants **lifetime** Pro to the invited person when they accept (strict email match). Distinct from a **direct admin grant** (no claim step, granted immediately) and from a viral referral (pstrack has none — inviting to Pro is admin-only).
_Avoid_: referral (this is not user-to-user), gift code / redeemable code (invitations are bound to one email, not a shareable code), coupon.

**Pro badge**:
The small visual label marking an account as Pro in lists, rows, and tables (leaderboard, group members, profile). A presentation concern only — the entitlement is `Pro`.
_Avoid_: pro chip, pro pill, pro tag, pro marker (pick one name — it is the "Pro badge").

### Gamification (not Pro)

**Badge**:
An earned **achievement** (gamification), shown on a user's profile; some are "Rare". A `UserBadge` links a user to a badge they earned. This is a distinct concept from the **Pro badge** — do not conflate.
_Avoid_: using "badge" to mean the Pro indicator.

**Premium** (problem):
A `Problem` flagged `isPremium` — a LeetCode-premium problem that is skipped/excluded from a roadmap. Unrelated to **Pro**. The word "premium" belongs to LeetCode problems, not to the Pro entitlement.
