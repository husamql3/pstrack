# ADR 0002 — Observability: User Session Tracking & Event Logging

**Date:** 2026-06-29  
**Status:** Accepted

---

## Context

When a bug is reported in production, we currently have limited ability to reconstruct what happened. We have Sentry for error capture, but no way to correlate errors with the sequence of user actions that led to them, and no way to trace a specific user's journey through the system.

The core need: given a user report ("my solve didn't get verified"), be able to answer:
- What actions did they take?
- In what order?
- What did the system do in response?
- Where exactly did it fail?

---

## Decision

Introduce a lightweight observability layer with three components:

### 1. Client-side Session ID

A random `observabilitySessionId` is generated on the frontend when the app loads and stored in `sessionStorage`. This ID represents a single visit — it exists while the tab is open and is discarded when the tab is closed. It is distinct from the Better Auth session (which spans days/weeks).

### 2. Header Transport

The Eden Treaty client in `src/lib/api.ts` attaches the `observabilitySessionId` as a custom HTTP header (`x-session-id`) on every outbound API request. This happens globally — no per-call changes needed.

### 3. Server-side Extraction & Logging

The main Elysia app instance in `src/server/app.ts` uses `.decorate()` to extract the `x-session-id` header and make it available in every controller's context.

A logging utility at `src/server/lib/axiom.ts` wraps the Axiom SDK and exposes a `log(event, metadata)` function. Controllers call this at key business events.

All logging calls are **fire-and-forget** — called without `await` and with `.catch(() => {})` — so logging failures never affect the user's request.

### Event Schema

Every log entry includes:

| Field | Source |
|---|---|
| `userId` | Session context |
| `sessionId` | `x-session-id` header |
| `event` | Named string constant (e.g. `solve_attempted`) |
| `metadata` | Event-specific payload (problemId, groupId, API response, etc.) |
| `timestamp` | Axiom ingest time |

### Priority Events (Phase 1)

The submission/verification flow is logged first, as it is the most complex and most reported source of issues:

| Event | Logged at |
|---|---|
| `solve_attempted` | Controller receives solve request |
| `verification_started` | Trigger.dev job begins |
| `external_api_called` | LeetCode/Codeforces API request sent |
| `external_api_response` | API response received (including failures) |
| `verification_succeeded` | Points awarded, streak updated |
| `verification_failed` | Terminal failure state recorded |

---

## Alternatives Considered

**Write event logs to Postgres** — rejected. App data writes need consistency guarantees; log writes do not. Mixing them in the same database couples their availability and adds write load to the primary DB. A dedicated logging service handles high-volume append-only writes better.

**Use Sentry breadcrumbs only** — rejected. Sentry captures what happens at the error boundary, not the full user journey before it. Breadcrumbs are ephemeral and lost if no error is thrown.

**Log inside DAOs** — rejected. DAOs are Prisma-only by convention (`AGENTS.md`). Logging is a cross-cutting concern that belongs at the controller layer where the business action and its outcome are both known.

**Inject logging into every DAO** — rejected. This violates the single-responsibility principle for DAOs and scatters logging logic across the data layer.

---

## Consequences

- Axiom becomes a soft dependency — its unavailability must never surface to users (enforced by fire-and-forget pattern).
- `src/server/lib/axiom.ts` is server-only; never imported from client-side code.
- The `sessionId` in `sessionStorage` resets on every new tab — cross-tab correlation is not supported (acceptable for now).
- Debug workflow: filter Axiom by `userId` (looked up from username/email), then group by `sessionId` to reconstruct a visit, then read the event sequence chronologically.
