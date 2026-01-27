# Architecture

## 1. User Solves Daily Problem

```text
┌─────────┐                ┌─────────┐                ┌──────────┐
│ Client  │────(1) Mark────▶│   API   │────(2) Job────▶│ Trigger  │
│ (React) │     Solved      │ (Hono)  │    Trigger     │   .dev   │
└─────────┘                └─────────┘                └──────────┘
     │                           │                           │
     │                           │                           │
     │                      (3) Save to                 (4) Verify
     │                       Postgres                  LeetCode API
     │                           │                           │
     │                           ▼                           ▼
     │                    ┌──────────┐              ┌──────────┐
     │                    │ Supabase │              │ LeetCode │
     │                    │   PG     │              │   API    │
     │                    └──────────┘              └──────────┘
     │                                                    │
     │                                              (5) Valid?
     │                                                    │
     │                                                    ▼
     │                                           ┌──────────────┐
     │◀──────────(6) Realtime Notification──────│   Upstash    │
     │                                           │   Realtime   │
     └───────────────────────────────────────────┴──────────────┘
```

## 2. Leaderboard Access (Cached)

```text
┌─────────┐                ┌─────────┐
│ Client  │────Request────▶│   API   │
│         │                │         │
└─────────┘                └────┬────┘
     ▲                          │
     │                          │ (1) Check cache
     │                          ▼
     │                    ┌──────────┐
     │                    │ Upstash  │
     │                    │  Redis   │
     │                    └────┬─────┘
     │                         │
     │                    (2) Cache hit?
     │                         │
     │                    No   │   Yes
     │                    ┌────┴────┐
     │                    │         │
     │                    ▼         │
     │               ┌──────────┐   │
     │               │ Supabase │   │
     │               │   PG     │   │
     │               └────┬─────┘   │
     │                    │         │
     │              (3) Query       │
     │                    │         │
     │                    ├─────────┤
     │                    │         │
     │              (4) Cache result│
     │◀───────────────────┴─────────┘
     │           (5) Return data
```

## 3. Real-time Notification Flow

```text
                           SERVER SIDE
┌─────────────────────────────────────────────────┐
│                                                 │
│  User A shares solution                         │
│         │                                       │
│         ▼                                       │
│  ┌──────────┐      ┌──────────┐                 │
│  │   API    │─────▶│ Supabase │  (1) Save       │
│  │  (Hono)  │      │    PG    │                 │
│  └────┬─────┘      └──────────┘                 │
│       │                                         │
│       │ (2) Publish to channel                  │
│       ▼                                         │
│  ┌──────────────────┐                           │
│  │ Upstash Realtime │                           │
│  │   (WebSocket)    │                           │
│  └──────────────────┘                           │
│           │                                     │
└───────────┼─────────────────────────────────────┘
            │
            │ (3) Broadcast to subscribers
            │
            ├──────────────┬──────────────┐
            ▼              ▼              ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │ User B  │    │ User C  │    │ User D  │
      │ Client  │    │ Client  │    │ Client  │
      └─────────┘    └─────────┘    └─────────┘
      
      (4) Toast notification appears instantly
```

---

## Security Architecture

## 1. Authentication Flow

```text
┌────────┐           ┌────────┐           ┌────────┐
│ Client │──(1)─────▶│  API   │──(2)─────▶│ Better │
│        │   Login   │        │   Verify  │  Auth  │
│        │           │        │           └────────┘
│        │           │        │                │
│        │           │        │◀───(3)─────────┘
│        │           │        │    Session
│        │◀──(4)─────│        │
│        │  Cookie   │        │
└────────┘           └────────┘
     │
     │ (5) Subsequent requests
     ▼
┌────────┐           ┌────────┐           ┌─────────┐
│ Client │──────────▶│  API   │──────────▶│ Upstash │
│        │ + Cookie  │        │   Verify  │  Redis  │
│        │           │        │   Session │         │
│        │           │        │◀──────────┘         │
│        │◀──────────│        │
│        │  Response │        │
└────────┘           └────────┘
```
