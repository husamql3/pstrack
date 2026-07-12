# Branching Workflow

`stage` is the default working branch for PStrack. Treat `main` as the stable release branch.

## Branch Roles

- `stage` is the long-lived integration branch for active development and preview-ready work.
- `main` is reserved for stable releases.
- Feature and fix branches start from `stage`.

## Agent Defaults

- Start new work from `stage`.
- Use focused branch names such as `feat/groups-invite-links`, `fix/solve-verification-window`, or `chore/trigger-env-sync`.
- Do not push branches or open pull requests unless the user explicitly asks.
- Do not push directly to `stage` unless the user explicitly asks.

## Promotion to Main

Move changes from `stage` to `main` through a deliberate `stage` to `main` pull request after verification.

## Deployment

- A push to `stage` deploys the verified commit to Vercel staging at
  `https://pstrack.vercel.app` and runs staging smoke checks.
- A push to `main` builds an immutable OCI image and deploys it to Coolify
  production after approval through the GitHub `Production` environment.
- Promotion is a deliberate `stage` to `main` pull request. The Vercel and
  Coolify runtime artifacts differ, so revision identity and both environment
  smoke checks are the promotion evidence.
