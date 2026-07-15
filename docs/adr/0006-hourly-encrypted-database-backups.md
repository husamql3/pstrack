# ADR 0006 - Hourly encrypted database backups

**Date:** 2026-07-09
**Status:** Accepted

---

## Context

PStrack is migrating from managed infrastructure to a self-hosted VPS managed by Coolify. The VPS will run the application, Postgres, Redis, and a separate mail-service project. Once Postgres moves onto the VPS, PStrack needs an operator-owned backup path that does not depend on Neon.

The backup repository is:

`husamql3/pstrack-db-backups`

The goal is fast disaster recovery for the production Postgres database, not a human-readable data export.

---

## Decision

Use a dedicated backup repository as the control plane and storage location for encrypted Postgres dumps.

The production VPS runs the hourly backup job. The job connects to Postgres over the private Docker/Coolify network, creates a Postgres-native dump, encrypts it before it touches Git, writes a small manifest, then pushes the retained backup tree to a machine-owned `backup-data` branch.

### Repository layout

The repository uses two long-lived branches:

| Branch | Purpose |
|---|---|
| `main` | Backup scripts, restore scripts, documentation, and operational runbooks |
| `backup-data` | Machine-managed encrypted backup files and per-backup manifests |

Backups are stored by UTC timestamp:

```text
backups/{year}/{month}/{day}/{hour}/pstrack.dump.age
backups/{year}/{month}/{day}/{hour}/manifest.json
```

Example:

```text
backups/2026/07/09/19/pstrack.dump.age
backups/2026/07/09/19/manifest.json
```

### Dump format

Each backup is a Postgres custom-format dump:

```bash
pg_dump -Fc
```

The dump is encrypted with `age` before it is committed. The backup repository never stores plain SQL, plain JSON exports, or unencrypted database content.

### Encryption key ownership

The VPS stores only the public `age` recipient key. It can encrypt backups but cannot decrypt them.

The private decryption key is kept outside the VPS and outside GitHub, such as in a password manager and on a trusted local machine used for restore drills.

### Manifest

Each backup has a `manifest.json` beside the encrypted dump. The manifest contains metadata only, never user data.

Recommended fields:

```json
{
  "createdAt": "2026-07-09T19:00:00Z",
  "database": "pstrack",
  "format": "pg_dump custom",
  "encrypted": true,
  "encryption": "age",
  "dumpFile": "backups/2026/07/09/19/pstrack.dump.age",
  "sha256": "sha256-of-encrypted-file",
  "sizeBytes": 12345678,
  "pgVersion": "17",
  "appCommit": "abc123",
  "schemaMigration": "20260709183000_some_migration"
}
```

### Retention

Keep:

| Window | Retention |
|---|---|
| Hourly | 48 hours |
| Daily | 30 days |
| Weekly | 12 weeks |
| Monthly | 12 months |

The `backup-data` branch is machine-owned. The backup job prunes backups outside the retention policy and force-pushes a single current retained snapshot. This keeps Git history from growing forever with deleted binary dump files.

### Authentication

The VPS pushes to `husamql3/pstrack-db-backups` with a GitHub deploy key that has write access only to that repository.

The deploy key must not grant access to the main PStrack application repository or any unrelated repositories.

### Restore verification

The first version provides manual/local restore verification. Restore scripts on `main` decrypt a selected dump, restore it into a temporary Postgres database, and run basic sanity checks.

Automated restore drills can be added later if there is a secure runner that can safely hold the private decryption key.

---

## Consequences

- The backup repo contains encrypted production database backups, so access still matters even though the dumps are encrypted.
- Losing the private `age` key means losing the ability to restore backups.
- Compromise of the VPS or backup repo does not expose plain database contents because only encrypted dumps are committed.
- Force-pushing `backup-data` is intentional and only safe because the branch is machine-owned backup state, not human-authored history.
- This is snapshot recovery, not point-in-time recovery. Data written after the latest successful hourly backup may be lost during a disaster.

---

## Alternatives considered

**Plain JSON files in Git** - rejected because they expose user data, create large diffs, are harder to restore safely, and are not a faithful Postgres recovery format.

**Unencrypted `pg_dump` files in Git** - rejected because the database contains user emails, auth/session data, group activity, points history, and payment-related state.

**Branch per day** - rejected because it creates too many branches and does not solve Git storage growth unless branches are aggressively deleted and garbage-collected.

**GitHub Actions pulls from production Postgres** - rejected for the first version because it would require exposing production database access outside the VPS. Running the backup job on the VPS keeps Postgres private to the Docker/Coolify network.

---

## Amendment 2026-07-12 — recovery proof and retention ([#283](https://github.com/husamql3/pstrack/issues/283))

The July 11 production audit required proving recovery and hardening retention. The
decisions below refine (not replace) the original ADR. Tooling lives in the
`husamql3/pstrack-db-backups` repo unless noted.

### Recovery objectives

- **RPO ≤ 1 hour, snapshot-only.** PITR/WAL archiving is **rejected** as the ticket's
  "approved alternative": on a Coolify-managed single Postgres container it is heavy
  ops (archive_command, base backups, WAL shipping, timeline management) for marginal
  gain at the current scale (sub-1 MB dump, beta cohort, hourly cadence).
- **RTO: minutes.** Measured by the isolated restore drill (`rto.total_restore_ms`),
  dominated by human decision time rather than data size.

### Object storage — rejected, keep GitHub with an immutability fix

- Migrating to backup-native object storage is **rejected with rationale**: GitHub is
  already off the production VPS, so the "survives total VPS loss / second failure
  domain" property is met. What GitHub lacked was immutability against a bad push.
- **Force-push is removed.** The hourly job is now **append-only**: pruning deletes
  files in a normal commit, so old dumps remain recoverable in history. A bad run,
  prune bug, or compromised deploy key can no longer wipe the retained set. History
  growth is reclaimed only by an operator-run, guarded `squash-checkpoint.sh` (the one
  sanctioned force-push).

### Retention — unchanged, now enforced and tested

- Windows stay 48h / 30d / 12w / 12mo. `test/prune-retention-test.py` pins "now" and
  asserts the exact retained set across all four tiers.

### Encryption key custody — dual recipient

- Each dump is now encrypted to **two** age recipients (primary + escrow), stored in
  separate custody. Either private key can restore. Removes the single-lost-key =
  total-loss failure mode. Legacy single-recipient dumps roll off within retention.

### Recovery verification — isolated restore drill

- `scripts/drill.sh` restores the newest dump into an **ephemeral Postgres 18 container
  on a Docker `--internal` (no-egress) network**, then verifies schema/migration, row
  aggregates, auth/session isolation counts, and the points invariant
  (`user.totalPoints == Σ PointsHistory.delta`), measures RTO + RPO, proves egress is
  blocked, and destroys everything. Aggregate-only output; the age key is referenced by
  path and never printed. A small non-zero points drift on a pre-#280 backup is expected
  and is evidence of a faithful restore, not a failure.
- Automated drills keep the age key **out of cloud CI**: a monthly keyless GitHub Action
  (`restore-drill-reminder.yml`) opens a `restore-drill` issue; an operator runs the
  one-command local drill and records sanitized evidence.

### Freshness alerting

- `backup-freshness.yml` (hourly) reads the newest manifest on `backup-data` and alerts
  the existing admin bot (`POST $BOT_URL/api/notify`) if it exceeds ~2h. Independent /
  dead-man's-switch alerting is tracked in [#290](https://github.com/husamql3/pstrack/issues/290).
