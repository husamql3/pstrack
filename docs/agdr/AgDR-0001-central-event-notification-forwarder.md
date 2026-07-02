# Central event-notification forwarder for admin bot

> In the context of adding more admin push-notifications (churn, membership, growth) to the husam-bot Telegram channel, facing a choice between wiring a dedicated `notifyAdmin` call at every event site vs one central hook, I decided to route realtime-classed `SystemEventType` events through a single forwarder inside `systemEventsDao.log()`, to achieve one integration point + a tunable routing table, accepting a slightly less-rich payload for the forwarded events and a small coupling of the event-log DAO to the bot transport.

## Context

husam-bot already receives six event types from pstrack via `notifyAdmin(event, payload)` (a fire-and-forget POST to the bot's `/api/notify`). We want to add churn (`GROUP_LEFT`, `MEMBER_REMOVED`) and membership (`GROUP_JOINED`, `JOIN_REQUEST_APPROVED/REJECTED`) notifications, keep low-signal events (`SOLVE_VERIFIED`, `MISS_BATCH`, `PAUSE_USED`, handle changes) out of the realtime channel, and make it cheap to re-tune what's realtime vs digest vs ignored later.

Every one of those events already flows through a single choke point: `systemEventsDao.log()`. Both the dedicated-emit and central-forwarder approaches must also address that the existing request-handler emits (`join.requested`, `feedback.submitted`, `user.created`, `purchase.pro`) are fire-and-forget and can be dropped when a serverless function freezes after the response — fixed separately by making `notifyAdmin` awaitable.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Dedicated `notifyAdmin` at each new event site | Rich, per-event payloads; explicit | N call sites to add + maintain; easy to forget one; routing policy scattered |
| **Central forwarder in `systemEventsDao.log()` + routing table** | One integration point; every current & future `SystemEventType` covered; realtime/digest/ignore policy lives in one map; trivial to re-tune | Payload limited to what the event log carries (actor + target); DAO gains a dependency on the bot transport |
| Generic `system.event` carrier on the bot side | Bot doesn't need a new schema per event; forwards type + actor/target | Less bespoke formatting (mitigated by a per-type template map on the bot) |

## Decision

Chosen: **central forwarder in `systemEventsDao.log()` with a `SystemEventType → policy` routing table**, forwarding realtime-classed events to husam-bot as a generic `system.event` payload, because it makes coverage automatic and the noise policy a single tunable map. `join.requested` keeps its dedicated emit (it needs the Accept/Reject/Transfer button payload the generic carrier can't express). The forwarder is best-effort: a bot-notify failure must never break the primary write, so it's fired after the log row is committed and its errors are swallowed+logged.

## Consequences

- New realtime events are added by editing one routing table, not by hunting call sites.
- `system-events.dao.ts` imports the bot transport — an acceptable, contained coupling; the DAO already owns "record that this happened," and "tell the admin" is adjacent.
- Forwarded events carry actor + target only; richer context (e.g. group slug) is resolved best-effort from `metadata`/`targetId`.
- Low-signal events default to `ignore`/`digest`, keeping the realtime channel actionable.

## Artifacts

- pstrack #236, branch `feature/#236-admin-notify-events`
- husam-bot #1 / PR #2 (receiving side: `system.event` schema + per-type formatter)
