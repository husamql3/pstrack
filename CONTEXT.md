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

### Shared solutions

**Shared solution**:
A platform-wide explanation and implementation published by a user for a canonical problem after that user has a verified solve. It belongs to its author; its originating solve establishes publishing eligibility, while a group provides context but does not own or contain it.
_Avoid_: group solution, solve post, submission

An author has at most one shared solution for each canonical problem.
Shared solutions have no private draft state; creation and revision happen only through explicit publication.

**Solution reveal**:
An explicit acknowledgement that exposes shared-solution content to a signed-in user who has not yet solved the problem. Discovering that solutions exist does not itself reveal their code or explanation.
_Avoid_: unlock (revealing is not an entitlement or purchase), mark as solved

**Solution revision**:
An immutable snapshot of a shared solution represented as a Markdown document. Its fenced code block contains the solution code and identifies the programming language; prose before or after the block is optional. A shared solution identifies its current revision, while discussion about earlier revisions remains attached to the snapshot it addressed.
_Avoid_: edit, version (when referring to the snapshot itself)

Every solution revision contains exactly one fenced code block.

**Line comment**:
A discussion comment anchored to a line or contiguous line range in one solution revision. Its anchor never moves to a newer revision automatically.
_Avoid_: code note, inline edit

**Solution thread**:
A discussion started by either a general comment on a shared solution or a line comment on a solution revision. Replies are chronological and flat rather than recursively nested.
_Avoid_: nested comment tree

### Operations

**Job run**:
A durable record of one internal background job execution attempt for a logical time window or manual operation. It provides idempotency and an operational audit trail for Trigger.dev-dispatched work.
_Avoid_: task run, cron log, job log
