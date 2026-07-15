# Trigger.dev GitHub Actions

Source: https://trigger.dev/docs/github-actions.md

Use GitHub Actions to deploy Trigger.dev tasks from CI. PStrack uses Bun and pins the Trigger.dev CLI through `package.json`, so workflows should call the local package script instead of `trigger.dev@latest`.

## Required Secret

Add `TRIGGER_ACCESS_TOKEN` in GitHub repository settings under `Settings -> Secrets and variables -> Actions`.

Create the token in Trigger.dev from the Personal Access Tokens page:

https://cloud.trigger.dev/account/tokens

Trigger.dev also needs exactly two runtime variables: `JOB_DISPATCH_URL` and
`JOB_DISPATCH_SECRET`. Run `bun run env:sync:trigger` after adding them to the
local production environment file. The sync command deliberately excludes all
database credentials.

For automated deploys, configure `JOB_DISPATCH_URL` as a GitHub Actions
repository variable and `JOB_DISPATCH_SECRET` as a repository secret. The app
must receive the same secret through Coolify.

## Production Deploy

The production workflow lives at `.github/workflows/release-trigger-prod.yml`. It runs on pushes to `main` and can also be started manually with `workflow_dispatch`.

The workflow uses:

```sh
bun run deploy:trigger-prod
```

That script maps to:

```sh
trigger deploy
```

## Version Pinning

Keep `trigger.dev`, `@trigger.dev/sdk`, and `@trigger.dev/build` on the same version. Trigger.dev deploys can fail when the CLI and package versions do not match.

## Freshness and reconciliation

Query `GET /api/v3/internal/jobs/freshness` with the job bearer credential to
confirm the latest successful run for every scheduled job.

`reconcile-points` runs daily at 00:30 UTC, after the midnight assignment and miss
jobs. It replays the immutable points ledger with the per-entry zero floor and sends
an aggregate-only admin alert when cached totals drift. It never repairs automatically.

Operators can inspect or repair drift with:

```sh
bun run points:reconcile
bun run points:reconcile -- --expected=<count> --prepare
# Restore that exact backup into an isolated database and verify it first.
bun run points:reconcile -- --expected=<count> --apply --restore-proof=<backup-sha256>
```

The prepare form creates and checksum-verifies a fresh encrypted production backup over
the configured `pstrack` SSH alias. The apply form refuses to proceed unless the dry-run
count matches and the latest backup checksum matches the separately supplied isolated
restore proof. It performs the repair only over SSH, records aggregate evidence in
`JobRun`, and requires a zero-drift post-check. It does not print identities or
credential values; the HTTP dispatch credential cannot invoke repairs.

The skipped July 10 mark-missed window has a bounded one-day reconciliation:

```sh
bun run jobs:reconcile-mark-missed --confirm=2026-07-10
```

The command uses the fixed key `reconcile-mark-missed:2026-07-10`. Re-running it
returns the ledger's prior result, while domain constraints prevent duplicate
miss penalties.
