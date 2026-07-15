# Environment and Operations

This is the source of truth for PStrack's required environment boundaries and
operating procedures. ADRs record decisions at the time they were made; issue
#278 and `TODO.md` remain the evidence ledger for what is production-verified.
When an ADR conflicts with this file, add an amendment to the ADR. Never copy
credential values into logs, issues, commits, or evidence.

## Ownership and boundaries

| Environment | Owner and source | Data boundary | External effects |
|---|---|---|---|
| Local | Developer; ignored `.env` | Local PostgreSQL and Redis only | Email defaults to `log`; use provider sandboxes |
| Staging | `stage`; Vercel project | Dedicated Neon project with synthetic data; no production credentials or Redis | Dedicated OAuth apps, Polar sandbox, Trigger.dev staging, Sentry `staging`, email forced to `log` |
| Production | `main`; GHCR image on Coolify | Private PostgreSQL and service network on the VPS | Production OAuth/Polar and Sentry; Trigger/Stalwart/Redis rollout proof stays on their remediation issues |

The browser reaches Coolify's proxy, then the Bun application container. Only
the application and operator-approved migration/backup paths may reach the
production database. The required Trigger.dev design is scheduler-only:
authenticated app dispatch with `JOB_DISPATCH_SECRET`, without database
credentials. Consult #279/#290 before treating every production job as migrated.
PointsHistory is the immutable points authority; cached totals are repaired
from it, never the reverse.

Vercel has one current role: application staging. `pstrack.vercel.app` is not
production even though Vercel calls its deployment target “production.” Do not
remove `scripts/sync-vercel.ts`, the staging workflow, Neon adapter, or Vercel
configuration while ADR 0012 and `docs/STAGING.md` remain active.

## Configuration ownership

Ignored local files are inputs; platform stores are the runtime authorities.
Run every sync in dry-run/list-names mode first where supported.

| Command | Input | Destination | Allowed purpose |
|---|---|---|---|
| `bun run env:sync:prod` | `.env.prod` | Coolify production app | Production application variables |
| `bun run env:sync:stage:dry-run` / `env:sync:stage` | `.env.stage` | Vercel staging | Explicit staging allowlist only |
| `bun run env:sync:trigger` | `.env` | Trigger.dev | Dispatch URL/secret and scheduler configuration; never database URLs |
| `bun run env:sync:gh` | `.env` | GitHub Actions | CI/deployment variables required by workflows; never production DB access for tests |

Keep secret files ignored and mode `0600`. `.env.example` documents names and
safe placeholders only. Rotate or delete a platform secret only after a usage
search, platform variable-name inventory, successful replacement verification,
and rollback decision.

## Required deploy and promotion procedure

1. Merge reviewed changes into `stage`; CI and the Vercel staging deployment
   must pass the smoke contract in `docs/STAGING.md`.
2. Promote the reviewed source revision to `main` through the protected release
   path. Never rebuild unreviewed source for production.
3. GitHub Actions must build the production OCI image, publish its immutable SHA
   identity to GHCR, apply migrations through the approved release step, and
   ask Coolify to deploy it. Issue #286 tracks production proof of this path.
4. The deploy operation must poll to a terminal state, then verify revision,
   environment identity, root, database-backed health, auth, and critical APIs.
5. Record sanitized commit/image identity and smoke results. An open PR or green
   build alone is not production verification.

## Rollback

For an application-only regression, select the last known-good immutable image,
deploy it with `bun run scripts/rollback-coolify.ts`, wait for Coolify to finish,
and rerun production smoke checks. Prefer forward fixes after additive database
migrations; never roll application code back across an incompatible migration.
If schema compatibility is uncertain, stop writes and escalate instead of
guessing. Record the rollback target and verification without secret values.

## Backup and restore

The production backup service has created encrypted hourly PostgreSQL dumps in
its separate repository. Fresh files prove backup creation, not recoverability;
#283 tracks deployment of retention changes and a real isolated restore drill.

Restore drills must use the newest completed dump, an isolated non-production
database and storage path, and non-production provider credentials. Verify
decryption, `pg_restore`, migration status, aggregate table counts, auth/session
isolation, and points-ledger invariants; measure recovery time and data-loss
window. Never restore over production or treat `pg_restore --list` as a drill.
The detailed retention decision is in ADR 0006.

## Reconciliation

- Scheduled jobs: inspect the durable JobRun ledger by logical window and use
  the authenticated reconciliation command for missing windows. Replays must
  remain idempotent.
- Points: run `bun run points:reconcile` read-only first. A repair requires a
  fresh verified backup, expected mismatch count, and the procedure in
  `docs/POINTS.md`; it updates cached totals only.
- Staging: follow `docs/STAGING.md`; destructive reset/reseed requires explicit
  approval and the fail-closed target checks.

## Credential rotation

Inventory variable names and consumers, create a replacement alongside the old
credential, update the narrowest consumer set, verify authentication/signatures,
then revoke the old credential and record owner/date. Rotate deploy, database,
auth, and webhook credentials before telemetry credentials. OAuth and Polar
rotations require callback/webhook tests. Backup keys require a fresh backup and
isolated restore proof before revocation. Never rotate all sides simultaneously.

## Incident response

1. Declare the affected environment, user impact, start time, and incident owner.
2. Preserve evidence: revision/digest, health status, sanitized logs, JobRun
   windows, backup freshness, and aggregate database invariants.
3. Contain the smallest surface. Disable a failing scheduler/provider or roll
   back the app; do not reset databases or rewrite PointsHistory.
4. Recover using the rollback or isolated-restore procedure, then verify the
   complete browser → API → data → response path and provider callbacks.
5. Reconcile skipped jobs and cached points after correctness is stable.
6. Rotate credentials if exposure is plausible, document the timeline/root
   cause/follow-ups, and update TODO/issue evidence only for proven outcomes.

## Retirement gates

Legacy integration code is intentionally retained until all gates pass:

| Candidate | Current reason retained | Removal gate |
|---|---|---|
| Vercel + Neon adapter | Isolated staging | Replacement staging is live and ADR 0012 is superseded |
| Resend transport | Email rollback path while Stalwart rollout completes | Stalwart canary/observation and rollback-retirement evidence |
| Trigger.dev SDK | Active scheduler/dispatcher | A replacement scheduler is deployed and missed-window recovery proven |
| Upstash references | Historical docs/post-MVP wording or migration tracking | Code/config usage search and private Redis production verification |

For each retirement, search tracked code and history-facing docs, inventory live
variable names in Coolify/Vercel/GitHub/Trigger.dev, remove code/config in one
reviewable change, run all repository gates, deploy, observe, and only then
delete provider credentials. Mark historical ADR text as superseded; do not
silently rewrite it.
