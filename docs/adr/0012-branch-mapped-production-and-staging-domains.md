# Coolify Production and Vercel Staging

PStrack maps `main` to the production domain `https://pstrack.app` on Coolify.

Production deploys are built from `main` and published as production GHCR images for Coolify. Coolify pulls the GHCR image and runs the application on the VPS.

The existing Vercel project at `https://pstrack.vercel.app` is the staging
environment. Its Vercel `production` target is application staging and deploys
only from the repository's `stage` branch. It uses a dedicated Neon database,
Upstash Redis, OAuth applications, Polar sandbox catalog, Trigger.dev
environment, staging-tagged Sentry events, and `EMAIL_TRANSPORT=log`.

No Coolify production credential or data may be copied into Vercel. Staging
configuration is synchronized from the ignored `.env.stage` file through an
explicit allowlist. The staging database contains synthetic seed data only.

Every `stage` deployment must pass root, database-backed health, anonymous auth,
revision, environment identity, and log-only email smoke checks. Production
promotion remains gated by the GitHub `Production` environment, where
`husamql3` is the required reviewer.

Vercel Functions and Coolify's OCI runtime cannot consume one binary artifact.
Promotion therefore preserves the reviewed source revision and migration set,
then records environment-specific immutable deployment evidence. This is the
portable parity boundary; operational procedures live in `docs/STAGING.md`.

The Coolify admin dashboard uses `https://coolify.pstrack.app`.
