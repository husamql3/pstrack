# Trigger.dev GitHub Actions

Source: https://trigger.dev/docs/github-actions.md

Use GitHub Actions to deploy Trigger.dev tasks from CI. PStrack uses Bun and pins the Trigger.dev CLI through `package.json`, so workflows should call the local package script instead of `trigger.dev@latest`.

## Required Secret

Add `TRIGGER_ACCESS_TOKEN` in GitHub repository settings under `Settings -> Secrets and variables -> Actions`.

Create the token in Trigger.dev from the Personal Access Tokens page:

https://cloud.trigger.dev/account/tokens

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
