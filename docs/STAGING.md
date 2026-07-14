# Staging Operations

PStrack staging runs in the existing Vercel project at
`https://pstrack.vercel.app`. Vercel's `production` target is application
staging; application production remains on Coolify.

## Isolation contract

- Neon PostgreSQL uses a staging-only free-tier project. Staging has no Redis
  service (`REDIS_URL` unset): the approved staging-equivalent validation uses
  an authenticated disposable Redis in CI, followed by a production canary on
  the private Coolify network (ADR 0011 amendment, #288).
- Google and GitHub OAuth use dedicated staging applications and callbacks.
- Polar uses its sandbox catalog and webhook.
- Trigger.dev uses a staging environment and staging-only dispatch secret.
- Sentry events use the `staging` environment.
- `EMAIL_TRANSPORT=log` is mandatory and `RESEND_API_KEY` must be absent.
- Only deterministic synthetic seed users and groups may exist in staging.

Run `bun run env:sync:stage:dry-run` before `bun run env:sync:stage`. The sync
script accepts only its explicit allowlist; `.env.stage` must remain ignored and
mode `0600`.

## Reset and reseed

This procedure destroys all staging data. Confirm the target is staging and
obtain explicit destructive-operation approval before running it.

1. Pull the Vercel staging environment into a temporary ignored file.
2. Load the staging environment. The command compares the complete normalized
   database identities (hostname plus database name) with repository-controlled
   SHA-256 fingerprints; operators cannot override the approved targets.
3. After obtaining explicit destructive-operation approval, run
   `bun run db:reset:staging --confirm-staging-reset`. The command fails closed
   unless both Prisma URLs match the approved Neon host, the runtime identifies
   itself as staging, log-only email is active, and outbound email credentials
   are absent.
4. The command explicitly resets migrations, runs the deterministic master seed,
   and writes aggregate-only `staging-reset-evidence.json`. A healthy result
   requires the exact canonical 50 synthetic identities and 9 group identities,
   creators, and membership counts, plus exactly 315 daily problems. Evidence
   contains only aggregate mismatch counts, never account identifiers.
5. Run the staging smoke checks, retain the sanitized evidence, and delete the
   temporary environment file.

Never restore or clone production data into staging.

## Teardown

1. Disable the `deploy-vercel-staging` workflow job or its Staging environment.
2. Remove the Vercel deployment aliases and staging environment variables.
3. Delete the dedicated Neon resources only after confirming their
   identifiers do not match production.
4. Delete the staging OAuth applications, Polar sandbox webhook, Trigger.dev
   environment, and staging alert rules.
5. Retain only sanitized deployment and smoke evidence.

## Promotion model

Vercel Functions cannot execute the OCI image used by Coolify, so one binary
artifact cannot run in both environments. The approved equivalent is the same
reviewed source revision and migration set: Vercel records and verifies the
staging Git SHA; the deliberate `stage` to `main` promotion then builds the
immutable production image, whose digest and Git SHA are verified by the
production deployment workflow. Production still requires approval from
`husamql3`.
