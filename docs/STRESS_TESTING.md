# Stress Testing

PStrack has an in-process stress suite for deterministic reliability checks against
the real integration test database.

Run the fast subset:

```sh
bun run test:stress
```

Run a heavier manual or nightly pass:

```sh
PSTRACK_STRESS_REPETITIONS=20 bun run test:stress
```

The suite stresses every registered API route and every Trigger module through a
manifest guard. New routes or jobs must be classified in
`src/test/stress-manifest.ts`, then covered by a representative scenario.

The API matrix uses deterministic session doubles so application routes can
exercise authenticated and unauthenticated states. A separate Better Auth stress
test calls the real auth handler concurrently for the session-read boundary.

The primary failure signal is the post-run invariant audit in `src/test/stress.ts`.
It checks for duplicate memberships, join requests, daily problems, solves, point
ledger rows, badges, over-capacity groups, first-solver mismatches, and denormalized
`User.totalPoints` drift.
