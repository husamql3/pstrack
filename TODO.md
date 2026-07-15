# PStrack audit remediation TODO

Last evidence refresh: **2026-07-12 00:20 TRT**
Sources: repository at `origin/stage`, GitHub issues/PRs/Actions, public production
HTTP/TLS/DNS, and read-only production inspection over `ssh pstrack`.

This is the execution checklist for the [production remediation map](https://github.com/husamql3/pstrack/issues/278).
An item is checked only when the change is merged, deployed where applicable, and
verified. A green PR is **in progress**, not resolved.

## Fresh-session handoff contract

### Mission

Resolve every checked-off gap in this file, one GitHub issue at a time, until all
audit findings are either verified in production or explicitly rejected with a
recorded rationale. Correctness and recoverability come before cleanup or new
features. The next agent should treat this file as the progress ledger and GitHub
issues #278–#294 as the work queue.

### Read first

1. Repository `AGENTS.md` — product context, commands, conventions, and safety rules.
2. `docs/BRANCHING.md` — `stage` is the working base; `main` is stable production.
3. This `TODO.md` — current evidence, priority, dependencies, and acceptance checks.
4. [Wayfinder map #278](https://github.com/husamql3/pstrack/issues/278) and the one child issue being executed.
5. Relevant ADRs and operational docs referenced by the selected issue or changed code.

Do not assume this snapshot is still current. At the start of every session, refresh
the selected issue, PR, branch, CI, and affected live service before changing state.

### Required working method

1. Work on **one remediation issue per session** unless the user explicitly changes scope.
2. Use the `grilling` skill for any unresolved product, data-correction, security,
   recovery, or rollout decision. Ask one decision at a time. Previously agreed
   decisions for #279 are recorded below and should not be reopened without new evidence.
3. Create a dedicated branch from updated `origin/stage` and preferably a separate
   worktree. Never mix remediation changes into the existing email or unrelated branches.
4. Reproduce or measure the problem before editing. Capture only non-sensitive evidence.
5. Use TDD for behavior changes: failing regression test, minimal fix, green test,
   then refactor.
6. Run the narrowest relevant test continuously, followed by the repository gates:

   ```sh
   bun run typecheck
   bun run check
   bun run knip
   bun run test
   bun run build
   ```

7. Review the diff against both repository standards and the issue acceptance criteria.
8. Commit intentionally, push only when authorized, and open a PR to `stage`.
9. A merged code change is not enough for infrastructure work. Promote through the
   release path, verify production, record sanitized evidence, then update this file
   and close the issue.
10. Never mark a box from intent, local success, an open PR, or a healthy CI check alone.

### Suggested skills for the next agent

- `wayfinder` — continue the existing multi-session issue map and claim one ticket.
- `grilling` — mandatory for decisions or tradeoffs, per the user's instruction.
- `tdd` and `implement` — behavior-first implementation from the selected issue.
- `diagnose` — production drift, flaky jobs, failed deployments, or performance problems.
- `code-review` — standards and issue/spec review before publishing.
- `github:yeet` or `push` — intentional commit/push/PR workflow when requested.
- `github:gh-fix-ci` — inspect and fix failing GitHub Actions checks.
- `resolving-merge-conflicts` — only if a merge/rebase is already conflicted.
- `research` — current primary documentation for security, PostgreSQL, Coolify,
  Trigger.dev, Polar, Stalwart, Redis, or GitHub controls.

Do not spawn subagents unless the user or an invoked skill explicitly calls for them.

### Safety and authorization boundaries

- Never print, copy into issues, or commit secret values, private keys, database URLs,
  user-identifying rows, operator IPs, or audit credentials. Environment **names** and
  aggregate counts are acceptable.
- Read-only repository, GitHub, HTTP, DNS, Docker metadata, logs, and aggregate SQL
  checks are allowed when relevant.
- Before any production mutation, state the exact change, backup/preflight, expected
  result, rollback, and verification. Destructive database reset/drop commands always
  require explicit confirmation.
- Do not use `git reset --hard`, destructive checkout, forced pushes, or delete another
  worktree's changes.
- Preserve append-only `PointsHistory`; repair denormalized caches from the ledger,
  never rewrite history to match the cache.
- Keep production database credentials inside the app/private network. Trigger.dev,
  CI deployment jobs, and external monitors must use scoped HTTP credentials instead.
- Use aggregate-only evidence for reconciliation and alerts.
- Treat a backup as unproven until an isolated restore completes successfully.

### Production access available to the agent

The agent can inspect and operate the production stack through two configured access
paths. Prefer the narrowest path that matches the task and keep all outputs sanitized.

1. **Coolify MCP** — use the configured Coolify MCP as the preferred semantic interface
   for Coolify applications, services, deployments, environment-variable **names**,
   deployment logs/status, resource configuration, and controlled redeploy/rollback
   operations. Discover and use the MCP's actual exposed tools; do not invent tool names
   or assume a capability that is not present in the current session. If the connector
   is unavailable, report that fact and use the SSH path for safe inspection or ask the
   user to reconnect it.
2. **Production SSH alias** — connect with `ssh pstrack`. This alias is already configured
   for the production server. Use it for host-level systemd, Docker, firewall, disk,
   memory, package, network, backup, PostgreSQL, and mail inspection that Coolify MCP
   does not expose.

Use Coolify MCP for platform state and deployment intent; use `ssh pstrack` for host
truth. For high-risk changes, cross-check both after the operation. Never retrieve or
print environment values merely because either access path permits it. Production
mutation rules, preflight, rollback, and verification requirements above apply equally
to MCP and SSH actions.

Safe SSH connectivity preflight:

```sh
ssh -o BatchMode=yes -o ConnectTimeout=10 pstrack 'hostname; uptime -p'
```

Do not replace the `pstrack` alias with a raw host address in docs, issues, commits, or
chat output.

### Repository/worktree snapshot

This is a snapshot, not a guarantee; verify with `git worktree list` and `git status`.

| Worktree/branch | Purpose and state at audit time |
| --- | --- |
| `/Users/husam/Code/pstrack-audit` — `docs/audit-remediation-todo` | This handoff file; created from `origin/stage`; `TODO.md` initially uncommitted |
| `/Users/husam/Code/pstrack-jobs` — `fix/durable-job-dispatch` | #279 implementation worktree retained locally; PR #296 is merged and its remote branch was deleted |
| `/Users/husam/Code/pstrack-stress` — `agent/stress-testing-reliability` | PR #295 merged; remote branch deleted |
| `/Users/husam/Code/pstrack` — `feature/self-hosted-postal-email` | PR #277 open; also contained a local tracker-setup commit, so do not reuse casually |

The audit branch is rebased on `origin/stage` commit `5a450ee`, which includes merged
stress coverage and durable-job PR #296. Production `main` still lags behind `stage`;
release PR #276 was open at the refresh.

### Known #279 decisions from grilling

These decisions were explicitly agreed and implemented in merged PR #296:

- Use a dedicated `JOB_DISPATCH_SECRET`, separate from the bot credential.
- Use one allowlisted `POST /api/v3/internal/jobs/:jobName` dispatch endpoint.
- Derive scheduled idempotency keys from the logical time window inside the app.
- `JobRun` is unique on `(jobName, idempotencyKey)` with `RUNNING`, `SUCCEEDED`, and
  `FAILED`; replay a successful result, reject an active run, and retry a failed/stale run.
- Keep `JobRun` records for **one month**.
- Process mark-missed recovery in per-user/group transactions so retries resume safely.
- July 10 recovery must use dry-run + expected affected aggregate, apply normal point
  and streak effects, and suppress warning/automatic-removal evaluation.
- Keep only aggregate reconciliation evidence in `JobRun`.
- Alert the existing admin bot after exhausted retries and expose authenticated freshness;
  add independent external alerting later.
- Migrate in stages: app ledger/HTTP execution first, remaining Trigger dispatchers next,
  then remove database credentials from Trigger.dev.

## Current status

| Area | Status | Verified evidence |
| --- | --- | --- |
| Production app | Healthy, risks remain | App and `/api/v3/health` return 200; app container is healthy |
| Production database | Healthy, inconsistent cache | PostgreSQL is healthy; 27 migrations applied; 3 users have aggregate points drift totaling 21 points |
| Scheduled jobs | Merged to stage, not deployed | [PR #296](https://github.com/husamql3/pstrack/pull/296) is merged and CI-green; production has no `job_run` table |
| Backups | Running, recovery unproven | Encrypted hourly dumps are current; storage is Git-backed; no isolated restore/PITR proof |
| CI/CD | Passing, insufficiently protected | Stage CI is green; `main` and `stage` are unprotected; default workflow permission is write |
| Local environment | Usable, secret permissions weak | Bun, local PostgreSQL, and Redis run; `.env` is ignored but mode `0644` |
| Staging | Missing | No isolated staging app/database/Redis was found |
| Email | Infrastructure healthy, rollout incomplete | Stalwart is healthy; production app has no SMTP settings; MX/SPF/DMARC/DKIM are absent |
| Host | Running, hardening overdue | No failed units and 22% disk use; 152 upgrades and reboot required; root/password SSH enabled |
| Web security | Incomplete | TLS is valid; expected security headers are absent |

No child remediation issue (#279–#294) is fully resolved and closed yet.

## Verified resolved foundations

- [x] Production is hosted on Coolify with a private PostgreSQL container.
- [x] Production app, PostgreSQL, proxy, Coolify, and Stalwart containers report healthy.
- [x] The app exposes a database-backed health check at `/api/v3/health`.
- [x] The production image has a Docker `HEALTHCHECK`, enabling health-gated container swaps ([PR #273](https://github.com/husamql3/pstrack/pull/273)).
- [x] `www.pstrack.app` redirects to the canonical HTTPS origin and the auth-origin fix is deployed.
- [x] The application certificate is valid through 2026-10-08.
- [x] Host firewall rules limit infrastructure administration ports to the operator allowlist.
- [x] Encrypted database dumps are being generated and pushed hourly.
- [x] Points history has a uniqueness migration for `(userSolveId, reason)`.
- [x] Manifest-guarded API/Trigger stress coverage is merged into `stage`, and stage CI passes ([PR #295](https://github.com/husamql3/pstrack/pull/295)).
- [x] CI currently runs typecheck, Biome, tests, Prisma validation/migration drift, and build.

## P0 — correctness, recovery, and access

### Durable scheduled jobs and skipped-run reconciliation — [#279](https://github.com/husamql3/pstrack/issues/279)

- [x] Implement app-owned job execution, `JobRun` idempotency, authenticated dispatch, freshness evidence, and a bounded reconciliation command in [PR #296](https://github.com/husamql3/pstrack/pull/296).
- [x] Pass PR CI: typecheck, Biome, Knip, tests, Prisma validation, and build.
- [x] Review and merge PR #296 into `stage`.
- [ ] Promote the change through `stage` to `main`.
- [ ] Configure `JOB_DISPATCH_SECRET` in Coolify and the matching GitHub secret/URL without copying database credentials to Trigger.dev.
- [ ] Deploy the Prisma migration and verify the production `job_run` table exists.
- [ ] Deploy Trigger.dev dispatchers and prove each scheduled job records a successful logical window.
- [ ] Run the fixed July 10 reconciliation dry-run, compare the expected aggregate, then execute once with warnings/removals suppressed.
- [ ] Verify retry/replay cannot apply duplicate points or duplicate daily assignments.
- [ ] Verify one-month `JobRun` retention and freshness alerts.
- [ ] Close #279 only after post-deploy evidence is recorded.

### Points ledger reconciliation — [#280](https://github.com/husamql3/pstrack/issues/280)

- [ ] Explain the 3 current cache/ledger mismatches totaling 21 absolute points.
- [ ] Back up the affected rows and repair `User.totalPoints` from the immutable ledger transactionally.
- [ ] Re-run the invariant query and require zero mismatches.
- [ ] Add a scheduled reconciliation check with aggregate alerting and no PII.
- [ ] Add regression coverage for concurrent solve, miss, bonus, and clawback paths.
- [ ] Confirm Pro entitlement behavior for any account crossing the points threshold after repair.

### Polar production configuration — [#281](https://github.com/husamql3/pstrack/issues/281)

- [ ] Set the missing production `POLAR_PRODUCT_ID` for the production Polar catalog.
- [ ] Verify access token, product, success URL, and webhook belong to the same Polar environment.
- [ ] Remove `import.meta.env.PROD` from the server-side validation bypass; production must fail fast on missing required settings.
- [ ] Add a safe startup/configuration test that never logs credential values.
- [ ] Complete a sandbox checkout and a production smoke checkout/refund with webhook evidence.

### Secret rotation and local storage — [#282](https://github.com/husamql3/pstrack/issues/282)

- [ ] Rotate every credential exposed during the audit in dependency-safe order.
- [ ] Change local `.env` permissions from `0644` to `0600` and verify all secret files are ignored.
- [ ] Remove database credentials from GitHub Actions where jobs no longer need production database access.
- [ ] Remove stale Vercel and managed-service secrets after their integrations are retired.
- [ ] Replace broad sync scripts with explicit per-destination allowlists.
- [ ] Record rotation dates and owners without recording values.

### Backup recovery and retention — [#283](https://github.com/husamql3/pstrack/issues/283)

- [x] Produce current encrypted hourly custom-format PostgreSQL dumps.
- [ ] Restore the newest dump into an isolated database and verify schema, row aggregates, auth/session isolation, and points invariants. — _Harness `scripts/drill.sh` built + synthetically proven; awaiting the real-key drill for production evidence._
- [ ] Measure and record restore time and data-loss window; set final RTO/RPO. — _Targets set (RPO ≤ 1h, RTO minutes) in ADR amendment; final measured numbers pending the real drill._
- [ ] ~~Replace Git-backed backup retention with backup-native object storage in a second failure domain.~~ — **Rejected with rationale** (ADR 0006 amendment): GitHub is already off the VPS = second failure domain; the immutability gap is closed by removing force-push (append-only + guarded squash checkpoint) instead.
- [ ] Enforce and test hourly/daily/monthly retention rather than relying on Git history. — _Append-only model + `test/prune-retention-test.py` (4-tier) passing locally; awaiting deploy of the updated backup container._
- [ ] Enable PostgreSQL point-in-time recovery or document an approved alternative. — _Approved alternative (snapshot-only, RPO ≤ 1h) documented in ADR amendment; awaiting merge._
- [ ] Alert when the newest successful backup exceeds its freshness threshold. — _`backup-freshness.yml` written; awaiting `BOT_URL`/`BOT_NOTIFY_SECRET` repo secrets + merge._
- [ ] Schedule recurring automated restore drills. — _`restore-drill-reminder.yml` (monthly, keyless) written; awaiting merge._

**#283 status (2026-07-12):** All tooling built on branch `fix/prove-recovery-and-retention` in `husamql3/pstrack-db-backups`; 3 local test suites green (retention, dual-recipient, synthetic drill end-to-end). App-repo change is docs-only (ADR 0006 amendment + this file). Remaining to close: (1) run the real-key drill and record sanitized evidence, (2) deploy the append-only + dual-recipient backup container via Coolify, (3) add repo secrets + merge the two workflows. No box is checked until its production evidence exists, per the completion rule.

### Production host patching and SSH — [#284](https://github.com/husamql3/pstrack/issues/284)

- [ ] Capture a fresh backup and rollback access before maintenance.
- [ ] Apply the 152 pending package upgrades and reboot the host.
- [ ] Verify every container, HTTPS route, database, backup job, and mail service after reboot.
- [ ] Create a non-root sudo operator with tested key-based access.
- [ ] Disable root SSH login and password authentication.
- [ ] Reduce `MaxAuthTries`; disable X11 and unnecessary TCP forwarding.
- [ ] Add brute-force protection and verify logs/alerts.
- [ ] Establish a recurring patch/reboot policy.

### Release protection and workflow authority — [#285](https://github.com/husamql3/pstrack/issues/285)

- [ ] Protect `stage` and `main`; both are currently unprotected.
- [ ] Require PRs, CI checks, resolved conversations, and non-force-push history.
- [ ] Change default GitHub Actions permission from write to read.
- [ ] Disable Actions-created PR approvals unless explicitly required.
- [ ] Add production environment reviewers and deployment branch restrictions.
- [ ] Pin third-party Actions to immutable commit SHAs.
- [ ] Replace broad PAT usage with scoped `GITHUB_TOKEN`, OIDC, or a GitHub App.
- [ ] Make Knip blocking by removing `--no-exit-code` after its baseline is clean.

### Immutable, verified production deployment — [#286](https://github.com/husamql3/pstrack/issues/286)

- [x] Build both commit-SHA and branch-tag images in CI.
- [ ] Make Coolify deploy the SHA/digest, not mutable `ghcr.io/...:main`.
- [ ] Record the deployed Git SHA/image digest in runtime metadata and the health/status response.
- [ ] Poll Coolify until deployment succeeds or fails; the current workflow only triggers an API request.
- [ ] Run post-deploy smoke tests for root, health, auth session, database, and job freshness.
- [ ] Automatically roll back or provide a tested one-command rollback to the last known-good digest.
- [ ] Enable SBOM and provenance; both are currently disabled.
- [ ] Retain deploy evidence and the previous working artifact.

## P1 — environment isolation and service migrations

### Isolated staging — [#287](https://github.com/husamql3/pstrack/issues/287)

- [ ] Provision a separate Coolify staging app with a distinct hostname.
- [ ] Provision separate PostgreSQL and Redis instances; never share production data or credentials.
- [ ] Use sanitized deterministic seed data.
- [ ] Configure sandbox OAuth/Polar/Trigger/Sentry and `EMAIL_TRANSPORT=log`.
- [ ] Deploy the same immutable artifact promoted to production.
- [ ] Add staging smoke tests and promotion approval.

### Self-hosted Redis — [#288](https://github.com/husamql3/pstrack/issues/288)

- [x] Run a healthy local Redis container for development.
- [ ] Provision a private, authenticated Redis service in staging and production.
- [ ] Replace `@upstash/redis` REST usage with the selected native Redis client and pooled lifecycle.
- [ ] Verify key TTL, set membership, reconnect, and failure behavior under stress.
- [ ] Decide whether ephemeral keys are migrated or intentionally discarded.
- [ ] Remove `UPSTASH_REDIS_REST_URL/TOKEN` from code, Coolify, GitHub, and local sync.

### Stalwart rollout — [#289](https://github.com/husamql3/pstrack/issues/289)

- [x] Run a healthy Stalwart container.
- [ ] Publish MX, SPF, DKIM, and DMARC; none were found during this audit.
- [ ] Verify reverse DNS, HELO identity, TLS certificate, and IPv4-only outbound delivery.
- [ ] Create a private app-to-Stalwart network path and configure production SMTP variables.
- [ ] Merge/deploy [PR #277](https://github.com/husamql3/pstrack/pull/277) after rebasing and review.
- [ ] Canary low-risk tags, monitor queue/bounces, and test major inbox providers.
- [ ] Move magic-link delivery only after deliverability evidence is acceptable.
- [ ] Keep an explicit rollback route, then retire Resend and its credentials after the observation window.

### Layered health and alerting — [#290](https://github.com/husamql3/pstrack/issues/290)

- [x] Provide a basic public app/database health check.
- [ ] Split lightweight liveness from dependency-aware readiness.
- [ ] Add authenticated dependency detail without leaking internal errors.
- [ ] Add scheduled-job freshness and backup freshness signals.
- [ ] Add external uptime checks from outside the VPS.
- [ ] Alert on database latency/connections, disk/memory pressure, mail queue/bounces, failed deployments, and stale jobs/backups.
- [ ] Route alerts through a tested escalation path with deduplication and recovery notices.

### Runtime isolation and non-root containers — [#291](https://github.com/husamql3/pstrack/issues/291)

- [ ] Run the app as a numeric non-root user; it currently uses the image default/root.
- [ ] Run the backup container as non-root where technically possible.
- [ ] Set measured CPU and memory limits for app, database, mail, backups, and Coolify services.
- [ ] Enable a read-only root filesystem and explicit writable mounts where possible.
- [ ] Drop Linux capabilities and enable `no-new-privileges`.
- [ ] Load-test and verify backup/restore behavior after limits are applied.

### Web headers and private infrastructure access — [#292](https://github.com/husamql3/pstrack/issues/292)

- [x] Serve the app over valid HTTPS and restrict infrastructure ports with firewall source rules.
- [ ] Add HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` in report/test mode first.
- [ ] Verify auth redirects, OAuth, Polar, APIs, OpenGraph, Sentry, and email assets under CSP.
- [ ] Put Coolify and other administration surfaces behind a private-access mechanism.
- [ ] Remove public listeners for administration ports after private access is proven.

## P2 — engineering baseline and documentation

### Tests, dependencies, and static analysis — [#293](https://github.com/husamql3/pstrack/issues/293)

- [x] Merge deterministic stress coverage and make the stress suite pass in CI.
- [x] Keep current typecheck, Biome, Vitest, Prisma validation, and build green on `stage`.
- [ ] Make Knip failures blocking and fix the existing unused baseline.
- [ ] Run and resolve package/security audits, including transitive advisories.
- [ ] Pin reproducible Bun/tool versions across local, CI, Docker, and docs.
- [ ] Align PostgreSQL versions: local 17, CI 16/17, and production 18 currently differ.
- [ ] Add scheduled dependency updates with a tested merge policy.
- [ ] Split the large API stress scenario into maintainable domain fixtures without losing manifest coverage.

### Architecture and legacy cleanup — [#294](https://github.com/husamql3/pstrack/issues/294)

- [ ] Reconcile README, AGENTS, stack docs, runbooks, ADRs, and environment examples with the actual Coolify architecture. — _Implemented in the PR for #294; check only after review/merge and a fresh production evidence comparison._
- [ ] Document local, staging, and production environment ownership and data-flow boundaries. — _Implemented in `docs/OPERATIONS.md`; awaiting the same verification gate._
- [ ] Document deploy, rollback, backup, restore, reconciliation, credential rotation, and incident procedures. — _Implemented in `docs/OPERATIONS.md`; awaiting the same verification gate._
- [ ] Remove obsolete Vercel deployment code/config/secrets after confirming it has no remaining role.
- [ ] Remove retired Trigger.dev database access, Upstash, Resend, and legacy Neon references after each migration completes.
- [ ] Audit duplicated or contradictory env-sync scripts and docs. — _Repository audit implemented: canonical commands are `env:sync:prod|stage|trigger|gh`; check after live destination-name comparison._
- [ ] Keep this file synchronized with issue closure and production verification.

## Local environment follow-up

- [x] Bun 1.3.14 and Node 24 are installed; local PostgreSQL and Redis containers are healthy.
- [x] `.env` is ignored and no real secret file is tracked.
- [ ] Restrict `.env` from `0644` to `0600`.
- [ ] Add an isolated local test database/bootstrap command and document destructive reset boundaries.
- [ ] Standardize local/CI/production PostgreSQL major versions.
- [x] Decide whether Vercel tooling is being retired. — _Retained for isolated application staging; see ADR 0012 and `docs/STAGING.md`._
- [ ] Upgrade the local Vercel CLI from 54.20.1 to the current supported release.

## Architecture evidence pointer

Required boundaries and procedures live in `docs/OPERATIONS.md`; current proof
and residual migration state live in #278 and the child issues. The diagram
below is a target topology, not proof that every migration is deployed.

### Target application and deployment path

```text
Browser
  -> HTTPS / canonical pstrack.app origin
  -> Coolify Traefik proxy
  -> PStrack container (TanStack Start SPA + Elysia API, Bun runtime)
       -> private PostgreSQL 18 container through Prisma
       -> private Redis after the #288 rollout; no cache dependency before it
       -> Better Auth + Google/GitHub/Magic Link
       -> Polar checkout/webhooks
       -> private Stalwart SMTP; Resend remains a rollback transport pending retirement
       -> app-owned durable jobs dispatched by Trigger.dev Cloud over authenticated HTTP

Private VPS services
  -> Coolify control plane and proxy
  -> PostgreSQL
  -> encrypted hourly backup container
  -> Stalwart
```

The environment boundaries and current deploy/rollback procedures are canonical
in `docs/OPERATIONS.md`. Migration-specific production proof remains on the
individual remediation issues; do not infer deployment from an open PR or this
repository snapshot.

### Core correctness invariants

- `PointsHistory` is immutable and authoritative; `User.totalPoints` must equal its sum.
- Daily assignment is unique per `(groupId, assignedDate)`.
- A solve is unique per `(userId, dailyProblemId)`.
- A point reason is unique per `(userSolveId, reason)` when tied to a solve.
- First-solver bonus is awarded once and matches `DailyProblem.firstSolverId`.
- `SOLVED`, `PAUSED`, `MISSED`, and `VERIFICATION_FAILED` transitions follow the
  documented terminal-state rules; only `MISSED` breaks a streak.
- Scheduled logical windows execute at most once even across HTTP retries, Trigger
  retries, app restarts, and operator replay.
- No email, alert, or external provider failure may make the core database mutation
  partially apply or apply twice.

Relevant references: `docs/FLOWS.md`, `docs/POINTS.md`, `docs/schema.md`,
`docs/STRESS_TESTING.md`, `prisma/schema.prisma`, and `src/test/stress.ts`.

## Evidence ledger from the 2026-07-12 refresh

Treat every fact below as stale until rechecked if a deployment, maintenance action,
or configuration change occurred after the timestamp.

### Production host and containers

- Host uptime was about 3 days; root filesystem usage was 22%; memory usage was
  roughly 1.5/3.9 GiB; systemd reported zero failed units.
- App, PostgreSQL, Stalwart, Coolify proxy/control services, and related platform
  containers were running; health-enabled services reported healthy.
- Docker server was 29.6.1 and Coolify reported 4.1.2.
- UFW was active. Public web ports were open; SSH and Coolify administration ports
  were source-restricted. Administration processes still listened on all interfaces,
  so firewall correctness remains security-critical.
- The host reported 152 pending package upgrades and `/var/run/reboot-required`.
- Effective SSH settings included root login, password authentication, X11
  forwarding, TCP forwarding, and `MaxAuthTries 6`.
- The app and backup containers had no configured user, read-only root filesystem,
  memory limit, or CPU limit.

### Production application and web

- `https://pstrack.app/` returned 200 in about 250 ms.
- `https://pstrack.app/api/v3/health` returned 200 with `{"status":"ok","db":"ok"}`.
- `https://www.pstrack.app/` redirected to the canonical apex origin.
- TLS was issued by Let's Encrypt and valid through 2026-10-08.
- The root response did not expose HSTS, CSP, `X-Content-Type-Options`,
  `Referrer-Policy`, or `Permissions-Policy` during the check.

### Production database

- PostgreSQL reported a database size of about 12 MiB.
- 27 completed Prisma migrations were present; latest verified production migration:
  `20260707000001_points_history_unique_solve_reason`.
- The `job_run` table did not exist, proving #279 had not reached production.
- Aggregate invariant check found 3 mismatched `User.totalPoints` caches with 21
  total absolute points of drift. Do not publish account identifiers.

Safe aggregate drift query pattern:

```sql
WITH ledger AS (
  SELECT "userId", SUM(delta)::int AS points
  FROM "PointsHistory"
  GROUP BY "userId"
), drift AS (
  SELECT u."totalPoints" - COALESCE(l.points, 0) AS delta
  FROM "user" u
  LEFT JOIN ledger l ON l."userId" = u.id
  WHERE u."totalPoints" <> COALESCE(l.points, 0)
)
SELECT COUNT(*), COALESCE(SUM(ABS(delta)), 0) FROM drift;
```

Run identifying queries only in a controlled operator context, never paste results
into GitHub, chat, commits, CI logs, or this file.

### Backups

- `pstrack-db-backups` was running with `unless-stopped` restart policy.
- Logs showed successful hourly PostgreSQL custom-format dumps encrypted with age
  and pushed through the most recent completed hour.
- Backup data used a Docker volume plus a read-only mounted deployment key.
- Storage was a Git repository/branch, not backup-native object storage.
- No isolated restore drill, retention enforcement proof, second failure domain, or
  PITR evidence was found. Therefore only backup **creation**, not recovery, is checked.

### Production environment presence check

Only variable names were inspected. The live app had database, auth, OAuth, Polar
token/success/webhook, Resend, Upstash, Sentry, Axiom, and bot variables. It did **not**
show `POLAR_PRODUCT_ID`, SMTP transport variables, `EMAIL_TRANSPORT`, `REDIS_URL`, or
the new job-dispatch variable at audit time. Never inspect or print the values during
routine status work.

### Email and DNS

- Stalwart container was healthy.
- `mail.pstrack.app` had an IPv4 A record and no IPv6 AAAA record.
- MX, SPF, DMARC, and the checked DKIM selectors returned no records.
- Public connection attempts to ports 25, 465, and 587 were closed. This may be
  desirable for submission ports but must be reconciled with the intended outbound
  and inbound mail design. Do not open ports before threat-modeling the final path.
- Production app had Resend configuration and no SMTP configuration, so Stalwart was
  not the active application transport.

### GitHub and CI/CD

- `main` and `stage` returned “Branch not protected.”
- Repository Actions default workflow permission was `write`, and Actions could
  approve PR reviews.
- The production environment had no reviewers, wait timer, or deployment branch policy.
- Stage CI at merged durable-job commit `5a450ee` was green.
- PR #296 merged successfully and all listed CI checks passed.
- Knip ran with `--no-exit-code`, so its job could succeed with findings.
- Third-party Actions used mutable major-version tags rather than immutable SHAs.
- Docker provenance and SBOM were explicitly disabled.
- CI published SHA and branch tags, while production consumed the branch tag.
- The deploy job triggered the Coolify API but did not poll or smoke-test completion.

### Local environment

- Bun 1.3.14, Node 24.18.0, and Vercel CLI 54.20.1 were installed.
- Local PostgreSQL 17 and Redis 7 containers were healthy.
- `.env` was Git-ignored and not tracked, but its filesystem mode was `0644`.
- Local PostgreSQL 17, CI PostgreSQL 16/17, and production PostgreSQL 18 were not aligned.

## Recommended dependency order

This ordering minimizes correctness and rollback risk. Change it only with evidence:

```text
Wave 0: #279 durable jobs and skipped-run reconciliation
   |
   +--> #280 points reconciliation
   +--> #290 job-freshness health signal

Wave 1: #281 Polar config + #282 secret rotation
        #283 restore proof ----> #284 host patch/reboot
        #293 clean blocking baseline ----> #285 branch/workflow protection

Wave 2: #285 protection ----> #286 immutable verified deployment
        #287 isolated staging
             +--> #288 private Redis
             +--> #289 Stalwart canary
             +--> #291 runtime limits/non-root validation

Wave 3: #290 layered monitoring after jobs/backups/mail signals exist
        #292 headers/private admin access
        #294 final documentation and legacy retirement
```

Production host maintenance should not precede a successful restore drill unless an
urgent security patch changes the risk calculation. Production Redis/email/runtime
migrations should not be the first place their behavior is tested; staging comes first.

## Issue execution playbooks

The checkboxes above are authoritative progress. These playbooks explain how to
execute and prove them without prescribing secret values.

### #279 playbook — durable jobs

**Existing implementation:** PR #296 is merged into `stage`; its original branch was
`fix/durable-job-dispatch`. Primary surfaces:

- `prisma/schema.prisma` and the `add_job_run_ledger` migration
- `src/server/jobs/job-runs.service.ts`
- `src/server/jobs/jobs.service.ts`
- `src/server/jobs/jobs.controller.ts`
- `src/server/trigger/dispatch-job.ts` and scheduled task wrappers
- `scripts/reconcile-mark-missed.ts`
- `scripts/sync-trigger.ts` and `.github/workflows/release-trigger-prod.yml`
- unit, integration, and stress tests under `src/server/jobs/` and `src/server/stress/`

**Before merge:** review endpoint allowlisting/auth, unique-claim concurrency, stale-run
recovery, failed retry attempt increments, replayed result shape, error redaction,
one-month cleanup, job freshness thresholds, Trigger environment allowlist, and
reconciliation warning suppression. Confirm the migration is additive and rollback-safe.

**Rollout order:** configure app secret; merge to stage; deploy app/migration; verify
authenticated endpoint and table; configure matching GitHub/Trigger dispatch settings;
deploy Trigger tasks; invoke a harmless logical window or wait for schedules; verify
`JobRun` success/freshness; only then run July 10 dry-run and confirmed reconciliation.

**Rollback:** keep the additive table; restore the last known-good app digest if the app
fails; do not run reconciliation twice; successful idempotency keys must remain. If
Trigger dispatch fails but app is healthy, fix/roll forward the dispatcher rather than
restoring external database credentials casually.

**Production proof:** all scheduled jobs fresh, no duplicate assignments/ledger rows,
Trigger has no DB credentials, one reconciliation result for the fixed logical key,
zero unintended warnings/removals, and admin failure alert tested.

### #280 playbook — points drift

**Primary surfaces:** `src/server/points/points.dao.ts`, solve/miss logic in
`src/server/problems/problems.dao.ts`, leaderboard/users DAOs, `docs/POINTS.md`,
`src/test/stress.ts`, and the unique points migration.

**Diagnosis:** in a private operator session, compare each mismatched user's ordered
ledger to the cache and trace the mutation path/reason. Determine whether drift came
from historical duplicate/missed writes, concurrency, manual correction, or an outdated
code path. Do not “fix” before explaining the cause.

**Repair design:** add a dry-run script that reports aggregate count/absolute drift;
require an expected count; lock affected user rows; recompute from ledger; update only
the cache in a transaction; record aggregate audit evidence; make rerun a no-op. Take a
fresh verified backup first. Never insert compensating ledger rows merely to match a
bad cache.

**Regression tests:** solve + first bonus, multiplier, pause, miss, clawback, repeated
verification, concurrent same solve, retry after partial external failure, and Pro
threshold transitions. Stress invariant must remain zero drift.

**Production proof:** pre-repair expected aggregate matches; repair count matches;
post-repair aggregate is `0|0`; leaderboards/profile totals agree; no entitlement or
streak regression; continuous reconciliation alerts on an injected test fixture outside
production.

### #281 playbook — Polar and fail-fast environment

**Primary surfaces:** `src/env.ts`, `src/server/lib/auth.ts`, `.env.example`, Polar
checkout client hooks, success page, webhook grant/refund tests, and Coolify env config.

**Critical defect:** production validation is bypassed by
`skipValidation: !!process.env.SKIP_ENV_VALIDATION || import.meta.env?.PROD`, while the
live container lacked `POLAR_PRODUCT_ID`. Separate client build-time validation from
server runtime validation so a production server cannot boot with required settings
missing. Tests may explicitly set `SKIP_ENV_VALIDATION=1`; production must reject it or
the deploy pipeline must prohibit it.

**Configuration proof:** confirm Polar token, product ID, webhook secret, and success
URL all target production—not a mix of sandbox and production. Never log them. Test a
sandbox purchase first, then a small production checkout/refund with webhook idempotency,
Pro grant/revoke rules, session refresh, and admin notification evidence.

**Rollback:** configuration-only rollback to the previously known product is acceptable;
code rollback must not revoke already granted Pro. Preserve webhook idempotency and
manually reconcile any event received during the transition.

### #282 playbook — secrets

**Primary surfaces:** local `.env*`, `.env.example`, `scripts/sync-trigger.ts`, any env
sync scripts in `package.json`, GitHub Actions secrets/variables, Coolify env, Trigger
env, OAuth/Polar dashboards, bot, Sentry/Axiom, mail provider, and backup deploy key.

**Rotation sequence:** inventory names/consumers; add replacement credential alongside
old where supported; update the narrowest consumer; verify; revoke old; verify again;
record date/owner. Rotate high-impact deploy/database/auth credentials before telemetry.
OAuth/webhook credentials require callback/signature tests. Backup keys require a fresh
backup and restore test before revocation.

**Distribution goal:** each system receives only what it needs. Trigger gets dispatch
URL/secret, not DB credentials. CI test jobs use service-container credentials, not
production DB. Deployment uses a scoped Coolify credential. Client-exposed `VITE_*`
values must be intentionally public; everything else remains server-only.

**Local proof:** `chmod 600 .env`; ignored status verified; no secret material in Git
history, shell output, issue bodies, or generated artifacts. If history exposure is
confirmed, rotation is mandatory even if the file is later deleted.

### #283 playbook — recovery

**Primary references:** `docs/adr/0006-hourly-encrypted-database-backups.md`, backup
container/repository maintained outside this app repo, PostgreSQL documentation, and
Coolify volume/storage config.

**Restore drill:** choose newest completed encrypted backup; copy it to an isolated
host/database; verify checksum/manifest; decrypt in memory or protected temporary
storage; restore with `pg_restore` into a newly created non-production database; run
Prisma migration status and aggregate table/invariant checks; prove the restored app
cannot send real email/webhooks or access production integrations; destroy the drill
environment securely after evidence is captured.

**Do not:** restore over production, reuse production OAuth/email/webhook credentials,
or claim success from `pg_restore --list` alone.

**Target design questions requiring grilling:** RPO/RTO after measured drill, PITR/WAL
retention, hourly/daily/monthly retention periods, object-storage provider, encryption
key custody/recovery, restore-drill frequency, and alert ownership.

**Production proof:** successful timed restore, documented RTO/RPO, second failure
domain, enforced retention, backup freshness alert, and recurring drill automation.

### #284 playbook — host hardening

**Prerequisite:** #283 restore proof or an explicit emergency-risk exception.

**Preflight:** fresh backup; Coolify/application config export; console/rescue access;
tested second SSH session; package list; disk/memory headroom; maintenance window;
rollback/recovery contact. Keep the current SSH session open while testing the new user.

**Sequence:** create non-root sudo user and install key; test sudo/new login; patch
packages; reboot; verify platform; then change SSH settings in small steps using
`sshd -t` before reload. Disable root/password/X11 and unnecessary forwarding only after
new access works. Add rate limiting/brute-force protection and unattended security update
policy appropriate to the host.

**Post-reboot proof:** Docker/Coolify/proxy/app/DB/mail/backups healthy; root and health
URLs 200; DB query works; backup completes; certificate routing works; only intended
listeners/firewall paths remain; root/password login attempts fail; operator key login
and sudo work.

### #285 playbook — GitHub protection

**Primary surfaces:** repository rulesets/branch protection, Actions workflow permission,
production environment, `.github/workflows/*.yml`, and composite setup action.

**Target controls:** PR required for `stage`/`main`; no force push/deletion; resolved
reviews; required checks using stable names (`Typecheck`, `Biome CI`, `Knip`, `Vitest`,
`Validate Prisma schema`, `Build`); production environment limited to `main` with a
reviewer; default token read-only; job-level grants only; Actions cannot approve PRs;
third-party actions pinned to full commit SHA.

First clean Knip and remove `--no-exit-code`, or do not make a falsely green Knip check
required. Verify auto-PR still works with explicit `pull-requests: write`. Test controls
with a disposable PR and rejected direct push; do not lock out the release workflow.

### #286 playbook — immutable deployment

**Primary surfaces:** `.github/workflows/ci.yml`, Docker metadata/build steps, Coolify
application image configuration/API, health endpoint, and deployment docs.

**Implementation target:** publish image by full Git SHA and digest; pass the immutable
reference to Coolify; wait/poll a specific deployment until terminal state; surface logs
on failure; expose sanitized revision metadata; run post-deploy HTTP/auth/DB/job checks;
retain previous digest; provide tested rollback; attach SBOM and provenance.

**Failure behavior:** no deployment on failed CI; timeout is failure; a successful API
trigger is not deployment success; a 200 root page without DB/job readiness is not enough.
Rollback must select the previous digest, wait, and re-run smoke checks.

### #287 playbook — staging

**Decisions requiring grilling:** staging hostname/access, cost ceiling, persistence,
OAuth provider apps/callbacks, Polar/Trigger projects, and who may approve promotion.

**Isolation:** separate Coolify app, PostgreSQL, Redis, storage, encryption keys, OAuth,
Polar sandbox, Trigger environment, Sentry environment, bot/alerts, and log-only email.
No production DB URL, session/auth secret, webhook secret, or SMTP credential may be
present. Seed only synthetic data.

**Parity:** deploy the same immutable image and migration path as production; use the
same health/readiness and resource model; run browser -> API -> DB -> job verification.
Document reset/reseed and teardown. Add a deliberate assertion that staging cannot send
external transactional email.

### #288 playbook — private Redis

**Primary surfaces:** `src/server/lib/redis.ts`, `src/env.ts`, Redis call sites, stress
tests, Coolify, `.env.example`, and Upstash credentials.

**Current code:** `@upstash/redis` REST client, lazy singleton, and Upstash URL/token.
Choose the native client (`redis`/`ioredis` or another justified option) through grilling.
Design connection reuse for the Node/Fluid-style long-lived runtime, TLS/auth, timeouts,
bounded retries, graceful shutdown, and observable failures.

**Data handling:** inventory keys and TTLs; classify all data as ephemeral or durable;
either migrate deliberately or document safe discard. Never migrate session/auth data
without explicit validation. Test reconnect, unavailable Redis, duplicate set writes,
TTL expiry, and concurrent operations in staging before production cutover.

**Retirement proof:** app uses private `REDIS_URL`; no Upstash network calls; old keys
handled; Upstash variables removed from every destination; credentials revoked after an
observation window.

### #289 playbook — Stalwart

**Primary surfaces:** PR #277, `src/server/lib/email.ts`, notification modules,
`src/env.ts`, `.env.example`, ADR/email docs, DNS, Stalwart config/queue, and private
Coolify networks.

**Before code merge:** rebase PR #277 on current `stage`; resolve divergence from
stress/jobs changes; verify all email paths use the unified transport; ensure request
handlers remain fire-and-forget where documented; validate log transport redacts tokens
and personal content appropriately.

**Infrastructure:** define whether the server is outbound-only or accepts inbound mail;
publish correct SPF/DKIM/DMARC and any necessary MX; verify PTR/rDNS and HELO; keep IPv6
disabled until reputation/routing is proven; allow app submission over private network;
do not expose submission/admin ports publicly without authentication and rate limits.

**Canary:** start with a low-risk tag, verify provider inbox placement and queue/bounce
signals, increase gradually, move magic links last, keep Resend override/rollback, and
observe before revoking Resend. A healthy container is not deliverability proof.

### #290 playbook — health and alerts

**Primary surfaces:** `src/server/modules/health.ts`, Docker healthcheck, #279 freshness
endpoint, backup logs/manifest, Sentry/Axiom/bot, and external uptime provider.

**Endpoint model:** liveness performs no slow dependency calls; readiness checks critical
dependencies with strict timeouts; authenticated detail provides sanitized component
state/revision; public responses never include raw errors, hostnames, credentials, or
query text. Docker should use liveness/readiness appropriate to rollout semantics.

**Signals:** HTTP availability/latency, DB connectivity/latency/pool, job logical-window
freshness, backup age/restore drill, disk/memory/container restart, deploy failure/revision,
mail queue/bounce, and certificate expiry. Define thresholds, dedupe, escalation, and
recovery notifications. Test by injecting one controlled failure per signal.

### #291 playbook — runtime isolation

**Primary surfaces:** `Dockerfile`, backup image, Coolify resource settings, writable
paths, native dependencies, and load/stress tests.

**Sequence:** measure baseline peak/steady resources; create numeric non-root user in
images; chown only needed files; test Prisma/native modules/font/OG rendering; enumerate
writes; mount explicit writable tmp/data paths; enable read-only root; drop capabilities;
set `no-new-privileges`; apply conservative CPU/memory limits one service at a time.

Do database/mail limits only with service-specific headroom and recovery tests. Verify
OOM/restart behavior does not corrupt jobs or backups. Keep Coolify management capacity
reserved on the shared VPS.

### #292 playbook — web security/private access

**Primary surfaces:** app/proxy header config, auth/OAuth/Polar routes, OpenGraph/Sentry
assets, Coolify/Stalwart admin listeners, UFW, DNS, and chosen private-access provider.

**Headers:** inventory actual script/style/image/connect/frame/form origins; deploy CSP
Report-Only first; collect violations; add nonce/hash strategy if required; then enforce.
Add HSTS only after all required subdomains are HTTPS-ready; decide `includeSubDomains`
and preload deliberately. Add `nosniff`, referrer, permissions, frame-ancestor, and
cross-origin policies with browser regression tests.

**Private access decision requiring grilling:** WireGuard/Tailscale/Cloudflare Access or
another mechanism. Prove emergency access, certificates, OAuth callbacks, API/webhooks,
and automation before closing public admin firewall paths.

### #293 playbook — engineering baseline

**Primary surfaces:** `vitest.config.ts`, stress suite, `knip.json`/package script,
`bun.lock`, `package.json`, CI setup action, Docker base images, Dependabot/security
settings, and runtime version docs.

**Work:** capture current Knip output and fix/allowlist intentionally; make exit code
blocking; run current package/security audit; update direct dependencies in small groups;
resolve transitive advisories at their source; pin Bun and tooling; align PostgreSQL
majors or explicitly test supported versions; keep stress repetitions deterministic;
split the large API stress matrix by domain while retaining manifest completeness.

**Proof:** clean fresh install with frozen lockfile; all gates green locally and CI;
no ignored high/critical advisories without time-bounded rationale; repeated stress run
stable; documented tool/runtime versions match CI and Docker.

### #294 playbook — documentation and retirement

Run last because it describes the end state. Compare actual runtime/config/secret names
against `README`, `AGENTS.md`, `.env.example`, `docs/stack.md`, ADRs, branching/deploy,
Trigger, email, backup, and incident docs. Update diagrams and commands, mark superseded
ADRs rather than silently rewriting history, and delete legacy code/config only after
usage searches plus live configuration prove it is unused.

Explicitly reconcile Vercel: the app is now on Coolify, while Vercel secrets/tooling may
remain. If Vercel has no role, remove CLI workflows/docs/secrets. If retained for a real
purpose, document it and upgrade CLI 54.20.1 to 55.0.0 or newer.

## Safe evidence-refresh commands

These commands are examples for a fresh agent. Inspect them before running and keep
outputs sanitized.

Before shell inspection, query the configured Coolify MCP for the application,
deployment, database, Redis, mail, and backup resource status when those tools are
available. Compare MCP-reported deployment state with container/health evidence over
`ssh pstrack`; neither source alone proves the full end-to-end path.

```sh
# Repository and worktree state
git fetch origin --prune
git status -sb
git worktree list
git log --oneline --decorate -8 origin/stage

# Remediation queue and active delivery work
gh issue view 278
gh issue view 279
gh pr view 296 --json state,isDraft,mergeable,statusCheckRollup,url
gh pr view 277 --json state,isDraft,mergeable,statusCheckRollup,url

# Public application evidence
curl -fsS -o /dev/null -w 'status=%{http_code} time=%{time_total}\n' https://pstrack.app/
curl -fsS https://pstrack.app/api/v3/health
curl -fsSI https://pstrack.app/

# DNS presence only
dig +short pstrack.app MX
dig +short pstrack.app TXT
dig +short _dmarc.pstrack.app TXT

# Production status; do not print environment values
ssh pstrack 'systemctl --failed --no-legend; docker ps --format "{{.Names}}|{{.Status}}|{{.Image}}"'
ssh pstrack 'docker logs --tail 80 pstrack-db-backups 2>&1'
```

For database checks, resolve the PostgreSQL container/user/database inside the host and
run aggregate SQL there. Never echo `docker inspect` environment values or connection
strings. For GitHub, list secret **names** only when necessary.

## Required update format after each ticket

When an issue is completed, update this file in the same or a follow-up documentation PR:

1. Check only acceptance boxes proven by evidence.
2. Change the status-table row if the overall state changed.
3. Update the evidence timestamp and replace stale facts rather than appending conflicts.
4. Add the merged PR URL and production revision/digest where non-sensitive.
5. Record tests, deployment verification, rollback readiness, and monitoring result.
6. Close the child issue only when its final production requirement is met.
7. Keep #278 open until every child is closed or explicitly rejected with rationale.

Suggested completion comment template:

```md
Implemented: <PR URL>
Deployed revision: <Git SHA or image digest, no secret values>
Verification: <tests + sanitized staging/production evidence>
Rollback: <tested target/procedure>
Monitoring: <signal observed and duration>
Residual risk: <none, or explicit follow-up issue>
```

## Completion rule

For each issue: implement on an isolated branch, add regression/operational tests,
pass CI, review, merge to `stage`, verify staging, promote the immutable artifact,
verify production, attach non-sensitive evidence to the issue, then check the final
box and close it. Do not mark infrastructure work complete from repository changes
alone.
