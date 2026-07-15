# Dependency and runtime policy

PStrack keeps installs and verification reproducible while allowing low-risk updates to arrive regularly.

## Pinned runtimes

- Bun is pinned to `1.3.14` in `.bun-version`, `package.json`, CI, and every Docker stage.
- Node-based tooling targets Node 24.
- Production and schema validation use PostgreSQL 18. The test suite runs against PostgreSQL 17 and 18, so the existing local PostgreSQL 17 volume remains supported without an unsafe in-place major upgrade.

When changing Bun, update every pin in one pull request and run a frozen install plus all repository gates. PostgreSQL major upgrades require a dump/restore or `pg_upgrade`; never point a newer server image at an older data directory.

## Automated updates

Dependabot opens grouped weekly minor/patch pull requests against `stage` for Bun packages and monthly pull requests for GitHub Actions. Major package updates remain deliberate because they need migration review.

An update is mergeable only when CI passes the frozen install, dependency audit, typecheck, Biome, Knip, both PostgreSQL test variants, Prisma validation, and production build. Security updates are not auto-merged; review the advisory, affected execution path, and lockfile diff first.

## Security audit

`bun run audit` blocks high and critical advisories locally and in CI. Lower-severity advisories remain visible with plain `bun audit` and should be resolved during routine updates when patched versions exist. Transitive overrides in `package.json` pin patched releases when an upstream package has not refreshed its range yet; remove an override once the direct dependency resolves to an equally safe version on its own.
