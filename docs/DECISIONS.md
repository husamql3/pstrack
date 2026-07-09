# Key Design Decisions

The "why" behind PStrack's load-bearing architectural choices. When a decision is non-obvious or has been re-litigated, it lives here.

---

## SPA over SSR

TanStack Start is configured for SPA mode (no server-side rendering). Dashboard and group pages are behind auth and highly personalized - SSR would add latency and complexity without meaningful SEO benefit for these routes. The public marketing/profile routes are simple enough that the SPA shell + a fast initial paint is sufficient.

## Eden Treaty for type safety

Zero codegen. The server `App` type is imported directly by the client. Renaming a route or changing a response shape produces a TypeScript error immediately in the calling hook - no `openapi.json` regeneration, no client SDK to publish.

## Points ledger as immutable append-only log

`PointsHistory` is never mutated, only appended. `User.totalPoints` is a denormalized cache. This gives a complete audit trail and makes clawbacks trivial - add a negative row instead of deleting the original. It also means a future "show me my points history" feature is already paid for.

## Verification failures never break streaks

LeetCode and Codeforces APIs are unreliable. A flaky API response should not break a user's streak. Only `MISSED` (end-of-day, no solve or pause) breaks the streak. Repeated verification failures increment `User.verificationFailuresThisMonth` (see `docs/POINTS.md`) so abuse is visible without punishing flaky-API days.

## Pauses consume a slot but still cost points

Pauses preserve streaks (a pause doesn't break the chain), but cost −5 points to prevent gaming the system. Free users get 2/month; Pro users get 4. The −5 is calibrated so a pause is a clearly-better deal than a miss for any user with a meaningful streak, while still being a real cost for new users with nothing to protect.

## Pro as a one-time purchase, not a subscription

Reduces churn anxiety and support burden. Pro can also be earned by grinding to 3,000 points - this keeps non-paying users engaged and the Pro gate feel achievable. The threshold is calibrated (~7 months of consistent play at average earn velocity) so a $5 buyer's mental math always favors paying.

The purchase grant is an **explicit `onOrderPaid` webhook write** (`src/server/lib/pro.ts`), not something the Better Auth Polar plugin does automatically — an earlier assumption that it did is why paying briefly granted nothing. The webhook is the source of truth; `/success` just refetches. Refunds revoke Pro only when `proSource === POLAR_PURCHASE`.

## hashvatar for avatars

Deterministic SVG generated from the username hash. No file uploads, no S3 bucket, no moderation pipeline. Avatars are always consistent and load instantly.

## No barrel `index.ts` files

TanStack Start uses Vite, which tree-shakes per-file. A barrel that re-exports a DAO file will pull `@prisma/client` (which imports `node:path`) into the browser bundle and crash. Direct imports are the safe default - every import points to the file that owns the symbol.

## Enums imported from `@/generated/prisma/enums`, never from `client`

The `client` file pulls in `node:url` and `node:path` and crashes the browser bundle. The `enums` file is pure values. `import type { Prisma }` from `client` is safe - type-only imports are erased at compile time.

## Atomic points mutation in one DAO function

Every point change goes through `applyPointsDelta(userId, delta, reason, meta)`. This function writes the history row, updates `totalPoints` clamped to floor 0, checks the Pro threshold, and runs in a single transaction. Callers never compute new balances directly. The floor lives here and nowhere else.
