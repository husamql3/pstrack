# Prebuilt GHCR images for Coolify deployments

Production deploys to Coolify use Docker images built and verified by GitHub Actions, then pushed to GHCR. Coolify pulls and runs those images; it does not build production images from source on the VPS.

This keeps the VPS focused on running PStrack, Postgres, Redis, and operational services instead of spending CPU and memory on builds. It also makes `main` the production release gate: CI typechecks, lints, tests, validates the schema, builds the app, publishes a GHCR image, and only then triggers Coolify to deploy that known-good artifact.

Only pushes to `main` publish production images and trigger production Coolify deploys. The `stage` branch remains the integration branch and reaches production through the existing `stage` to `main` release flow.
