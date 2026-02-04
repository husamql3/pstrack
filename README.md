# PStrack

```text
pstrack/
├── README.md
├── lefthook.yml          # git hooks config (pre-commit lint/format, pre-push tests)
├── turbo.json            # Turborepo config (task caching, monorepo orchestration)
├── .oxfmtrc.json         # oxc (Rust) formatter & linter rules – eslint/prettier replacement
├── .oxlintrc.json
├── apps/
│   ├── api/              # Hono + Bun (CF Workers) – routes, business logic, auth handlers
│   ├── site/             # Landing page (Next.js or static) → pstrack.app marketing
│   └── web/              # Main product UI (React + TanStack Start + Router + Query)
├── docs/                 # All planning & architecture documents
│   ├── features.md
│   ├── stack.md
│   ├── architecture.md
│   ├── timeline.md
│   ├── notifications.md
│   └── freemium-model.md
├── packages/
│   ├── auth/             # Authentication logic, Better-Auth instance, session helpers
│   ├── db/               # Drizzle ORM schema, migrations, shared DB types & DAOs
│   ├── realtime/         # Upstash Realtime helpers (pub/sub, WS subscription logic)
│   ├── shared/           # Types, utils, constants, zod schemas used by client & server
│   ├── storage/          # Supabase Storage logic (avatar upload, signed URLs, Sharp)
│   └── typescript-config # Shared tsconfig rules
├── scripts/              # Generator scripts & Automation tasks
├── .github/              # Workflows (lint → format → build → test → deploy on CF)
└── .agents/              # LLM agent / AI coding assistant skill definitions
    └── skills/
```
