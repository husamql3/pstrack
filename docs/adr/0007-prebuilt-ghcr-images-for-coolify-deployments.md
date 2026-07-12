# Prebuilt GHCR images for Coolify deployments

Production deploys to Coolify use Docker images built and verified by GitHub Actions, then pushed to GHCR. Coolify pulls and runs those images; it does not build production images from source on the VPS.

This keeps the VPS focused on running PStrack, Postgres, Redis, and operational services instead of spending CPU and memory on builds. It also makes `main` the production release gate: CI typechecks, lints, tests, validates the schema, builds the app, publishes a GHCR image, and only then triggers Coolify to deploy that known-good artifact.

Only pushes to `main` publish production images and trigger production Coolify deploys. The `stage` branch remains the integration branch and reaches production through the existing `stage` to `main` release flow.

## Immutable rollout contract

Production deploys use the pushed image digest, not a mutable tag. CI publishes a full commit-SHA tag, a branch tag, and the immutable digest reference (`ghcr.io/husamql3/pstrack@sha256:...`).

The Coolify deploy job sets the application image to the digest reference and injects sanitized runtime metadata:

- `PSTRACK_GIT_SHA`
- `PSTRACK_IMAGE_DIGEST`
- `PSTRACK_IMAGE_REF`
- `PSTRACK_DEPLOYED_AT`

`GET /api/v3/health` returns these fields under `revision` next to DB readiness, so CI can prove the running app is the artifact it just built.

After Coolify accepts the digest deploy, CI polls the returned deployment id until terminal success or failure. A successful trigger response is not considered a deployment.

CI then runs smoke checks for root page availability, health plus database readiness, anonymous auth session behavior, and internal job freshness when `JOB_DISPATCH_SECRET` is available. Deploy and smoke evidence are retained as GitHub Actions artifacts for 30 days.

## Rollback

Use the last known-good digest from the retained `image-release-*` or `deploy-evidence-*` artifact:

```sh
PSTRACK_ROLLBACK_IMAGE_REF='ghcr.io/husamql3/pstrack@sha256:...' \
PSTRACK_ROLLBACK_GIT_SHA='previous-good-sha' \
COOLIFY_API_URL='https://admin.pstrack.app' \
COOLIFY_API_TOKEN='...' \
COOLIFY_APP_UUID='...' \
bun run scripts/rollback-coolify.ts
```

After rollback completes, run the production smoke checks with the previous digest:

```sh
PSTRACK_PRODUCTION_URL='https://pstrack.app' \
PSTRACK_GIT_SHA='previous-good-sha' \
PSTRACK_IMAGE_DIGEST='sha256:...' \
JOB_DISPATCH_SECRET='...' \
bun run scripts/smoke-prod.ts
```
