# Auto-PR workflow: stage → main

> In the context of pstrack's `stage → main` release flow, facing the toil of hand-opening a release PR every time `stage` advances, I decided to add a GitHub Actions workflow that auto-opens/updates the PR — authed with a PAT and built on the `gh` CLI — to achieve a single, CI-gated, reviewable prod gate, accepting a dependency on the `PAT_TOKEN` secret.

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

- Every push to `stage` opens or refreshes one `🎯 Auto PR: stage → main`; pstrack CI runs on it via `PAT_TOKEN`.
- `PAT_TOKEN` must keep `contents: read` + `pull-requests: write` on pstrack; if it lapses, the workflow fails loudly.
- The bootstrap: merging *this* file into `stage` is itself a push to `stage`, so the first auto-PR appears immediately.
- No third-party actions in this workflow; the `stage → main` PR is never auto-merged — merge still requires human review + approval.

## Artifacts

- `.github/workflows/auto-pr.yml`
- Ticket husamql3/pstrack#265
