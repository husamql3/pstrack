# Superseded: Auto-PR workflow for stage → main

> Superseded by the manual promotion workflow in `docs/BRANCHING.md`.

## Superseded Decision

The previous decision added a GitHub Actions workflow that auto-opened or updated a `stage` to `main` pull request on every push to `stage`, authenticated with `secrets.PAT_TOKEN`.

This was removed because the workflow failed when the token could not create pull requests and because automatic pull requests conflict with the standing repo rule: do not push or open pull requests unless the user explicitly asks.

`stage` is now verified directly by CI on push. Promotion to `main` remains an intentional, human-requested pull request.

## Context

`main` deploys to production; work lands on `stage` first. pstrack's `ci.yml` runs only on `pull_request → main` / `push → main` — **nothing tests `stage`** — so the `stage → main` PR is the only place CI gates changes before prod. Opening that PR by hand each time is repetitive. db-studio already runs an equivalent `auto-pr.yml`; this ports the pattern to pstrack with a few enhancements.

## Options Considered

| Decision | Option | Pros | Cons |
|----------|--------|------|------|
| **Auth token** | **PAT (`secrets.PAT_TOKEN`)** ✓ | The auto-PR triggers `ci.yml` — the gate actually gates | Depends on a PAT secret + its scopes |
| | Default `GITHUB_TOKEN` | Zero secrets | GitHub won't run `pull_request` workflows on a PR it opened → PR has **no checks** |
| **Implementation** | **`gh` CLI** ✓ | No third-party action to trust/pin; create+update in one readable step | Slightly more shell |
| | `repo-sync/pull-request@v2` + `actions/github-script` (db-studio's shape) | 1:1 parity | Third-party action gets a write-scoped PAT; more YAML |
| **Trigger** | **`push: stage` only** ✓ | One code path; covers direct pushes and merges | — |
| | `push` + `pull_request.closed` (db-studio) | "merged PR #N" flavour text | Redundant (a merge is a push); needs a merged-guard |
| **PR body** | **Changelog of `main..stage`** ✓ | Shows exactly what ships to prod | — |
| | Single triggering commit (db-studio) | Simpler | Hides the full release scope |

Also: **empty-diff guard** (skip when `stage` isn't ahead of `main`, avoiding "No commits between…" errors) and **least-privilege perms** (`contents: read` + `pull-requests: write`, vs db-studio's `contents: write`).

## Decision

Chosen: **`gh`-CLI workflow, `push: stage` trigger, `PAT_TOKEN` auth, changelog body, empty-diff guard**, because it gives a genuinely CI-gated prod PR with the fewest external dependencies. The workflow file targets the `stage` branch (a `push:stage` workflow only runs from the copy present on `stage`).

## Consequences

- The auto-PR workflow was deleted.
- CI runs on `push` to `stage`, `push` to `main`, and pull requests targeting `stage` or `main`.
- `PAT_TOKEN` is no longer required for branch promotion automation.
- `stage` to `main` pull requests are created only when explicitly requested.

## Artifacts

- `.github/workflows/ci.yml`
- Ticket husamql3/pstrack#265
