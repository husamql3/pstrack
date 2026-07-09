# Production on Coolify with Vercel staging

PStrack maps `main` to the production domain `https://pstrack.app` on Coolify and keeps Vercel as the temporary staging/preview environment for `stage`.

Production deploys are built from `main` and published as production GHCR images for Coolify. Staging remains on Vercel during the migration so the first implementation slice does not also need a second Coolify environment, staging Postgres, staging Redis, and staging external integrations.

The earlier `stage.pstrack.app` idea is deferred. If Vercel is removed later, staging can move to Coolify with its own database, Redis, and sandbox/test integrations.

The Coolify admin dashboard uses `https://admin.pstrack.app`.
