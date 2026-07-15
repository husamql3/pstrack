# PStrack

**Show up. Solve. Repeat.**

Stay consistent with LeetCode — solve one problem a day, earn points, and compete with your group.

## Stack

TanStack Start · Elysia · Eden Treaty · Better Auth · Prisma + PostgreSQL · Trigger.dev · Polar · Bun

Production runs as a Bun container on Coolify with private PostgreSQL; private
SMTP is the rollout target tracked by #289. Vercel is retained only for the
isolated `stage` environment. See
[`docs/OPERATIONS.md`](./docs/OPERATIONS.md) for environment ownership, data
boundaries, deployment, recovery, and incident procedures.

## Develop

```bash
bun install
cp .env.example .env   # fill in secrets
bun run db:migrate
bun run dev            # https://pstrack.localhost
```

See [`AGENTS.md`](./AGENTS.md) for commands, conventions, and architecture. Roadmap lives in [`docs/timeline.md`](./docs/timeline.md).

## License

MIT — see [`LICENSE`](./LICENSE).
