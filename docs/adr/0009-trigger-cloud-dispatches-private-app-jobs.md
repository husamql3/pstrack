# Trigger.dev Cloud dispatches private app jobs

PStrack keeps Trigger.dev Cloud for scheduled and background job orchestration, but Trigger.dev must not connect directly to production Postgres after the VPS migration.

Production Postgres stays private inside the Coolify/Docker network. Trigger.dev Cloud calls authenticated internal PStrack endpoints, and those endpoints execute the job logic inside the app/VPS network. This preserves the operational convenience of Trigger.dev Cloud while keeping database access private to the self-hosted infrastructure.

This requires refactoring the existing Trigger.dev tasks away from direct Prisma work in the Trigger.dev runtime. The job implementation should live behind internal app endpoints guarded by a shared secret or equivalent machine authentication, with Trigger.dev acting as the external scheduler/dispatcher.
