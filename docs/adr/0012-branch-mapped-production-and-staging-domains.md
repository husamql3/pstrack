# Production and Staging on Coolify

PStrack maps `main` to the production domain `https://pstrack.app` on Coolify.

Production deploys are built from `main` and published as production GHCR images for Coolify. Coolify pulls the GHCR image and runs the application on the VPS.

The earlier Vercel staging setup is retired as part of the full Coolify migration. A future `stage.pstrack.app` environment should be created on Coolify with its own database, Redis, and sandbox/test integrations.

The Coolify admin dashboard uses `https://admin.pstrack.app`.
