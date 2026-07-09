# PStrack SEO Strategy

Pre-launch (Phase 10, beta to 50 users) competitive programming accountability platform. Plan is sized for that reality: foundation now, community compounding through public launch.

---

## 0. Reality Check

Three constraints shape this entire plan. Solve these before chasing rankings.

| Constraint | Why it matters for SEO |
|---|---|
| **TanStack Start runs as SPA, no SSR** (per AGENTS.md stack) | Googlebot can render JS but treats it as second-pass crawl. AI crawlers (GPTBot, PerplexityBot, ChatGPT-User, Google-Extended) mostly **don't execute JS at all**. An SPA marketing site is invisible to LLMs. **Resolution: SSR is in scope for marketing routes (approved 2026-06-09).** |
| **No public URL yet** | Can't run external audits, no GSC property, no backlinks, no CrUX field data. Roadmap below assumes a production domain by end of Phase 1. |
| **Niche tagline + brand-new domain** | Zero domain authority. Topical authority through programmatic pages and community seeding is the growth lever. |

**First principle**: for a freemium dev tool with LTV ~$14, CAC must be near zero. That forces organic + word-of-mouth, which forces SEO + community, which forces **server-rendered marketing pages**.

**Growth model (decided 2026-06-10)**: no blog, no comparison pages. Organic footprint = programmatic public pages (groups + profiles) + community seeding (Reddit, HN, NeetCode Discord). Content pages (`/about`, `/how-it-works`) use MDX for prose authoring.

---

## 1. Competitive Landscape

### Direct (same job-to-be-done)

| Competitor | What they do | PStrack's wedge |
|---|---|---|
| **LeetCode.com** | The source of truth, has its own streaks/contests | Curated roadmap + groups + accountability — LC's UX is firehose, not guided |
| **NeetCode.io** | The roadmap PStrack uses (NC250) | NeetCode has no streak/group/verification layer — PStrack is *the* social layer on his roadmap |
| **AlgoExpert** ($99+/yr) | Paid course | PStrack is $5 lifetime + free tier; different price point, different value |
| **Codewars** | Gamified katas | Different problem set; no interview prep focus |

### Keyword gap (opportunities)

None of the above ranks well for these high-intent queries:

| Query | Est. intent | Competition | PStrack fit |
|---|---|---|---|
| `leetcode accountability` | High | Very low | Perfect — own this |
| `leetcode streak tracker` | High | Low | Perfect |
| `neetcode 250 progress tracker` | High | Very low | Perfect |
| `leetcode study group online` | Medium-high | Low | Perfect — group feature |

**Lateral connection**: NeetCode himself has ~700k YouTube subs. The roadmap brand is a moat — being "the accountability layer for NeetCode 250" is positioning gold. Consider direct outreach for a guest mention once you have testimonials.

---

## 2. Site Architecture

Marketing site (SEO-critical, must be SSR) is **separate concern** from the app shell. Both ship from the same TanStack Start deployment, but marketing routes need server rendering enabled.

```
/                                  ← Homepage: value prop, social proof, CTA
/how-it-works                      ← Daily loop explained (MDX, placeholder — fill in copy)
/about                             ← Founder story (MDX sections, placeholder copy)
/groups                            ← Discover public groups (SSR)
  /groups/[slug]                   ← Indexable public group pages
/problems                          ← Full NeetCode 250/150/Blind75 list (SSR)
/$username                         ← Public profile (SSR)
/badges                            ← Badge gallery
/llms.txt                          ← AI crawler manifest
```

**Out of scope (decided 2026-06-10)**: `/blog`, `/compare/*`, `/pricing`, `/roadmaps/[roadmap]/[slug]` individual problem pages.

---

## 3. Content Strategy

**No blog. No comparison pages.** Organic footprint relies on:

1. **SSR'd public pages** — `/groups`, `/problems`, `/$username` all render server-side so crawlers read real content.
2. **Community seeding** — Reddit r/leetcode, HN Show HN, NeetCode Discord/subreddit. Primary acquisition channel for a $5 product with a tight dev niche.
3. **MDX content pages** — `/about` and `/how-it-works` authored in markdown. Content is written in third-person where appropriate to be quotable by AI search.

**Falsifiability**: if 90 days after public launch `leetcode accountability` and `leetcode study group` aren't on page 2 for their primary keyword, the SSR + community thesis is wrong — revisit a lightweight content strategy.

---

## 4. Programmatic Pages

One safe template. Apply the quality gate.

### Public group pages

- Per-group URL is indexable when group is public (`/groups/[slug]`)
- Render: name, member count, current daily problem, leaderboard top 5, recent solve activity
- Auto-`noindex` if member count < 5 OR no activity in 30 days (prevents thin-content drift)
- Included in dynamic sitemap automatically once quality gate is met

**Must be SSR.** No SPA hydration trick — AI crawlers won't see hydrated content.

**Deferred**: individual problem pages at `/roadmaps/[roadmap]/[slug]` — the `/problems` list page with SSR is sufficient for Phase 1-2. Revisit post-launch when aggregate solve stats are meaningful.

---

## 5. Technical Foundation

### P0 — SSR for marketing routes (approved)

- [x] TanStack Start supports server rendering per-route. Root is `ssr: true`; auth/admin/app routes opt out with `ssr: false`.
- [x] `/` — SSR, verified 2026-06-09
- [x] `/about` — SSR, founder-story skeleton (TODO: fill in 5 prose sections, ~600-1000 words total)
- [x] `/problems` — SSR flipped 2026-06-10 (was `ssr: false`)
- [x] `/groups` — SSR flipped 2026-06-10 (was `ssr: false`)
- [x] `/$username` — SSR flipped 2026-06-10 (was `ssr: false`)
- [x] `/how-it-works` — SSR, placeholder MDX content (TODO: fill in prose)
- Better Auth SSR caveat: root `beforeLoad` skips `authClient.getSession()` when `typeof window === "undefined"` (cookie forwarding unsolved). Public routes render in logged-out state server-side; auth state hydrates client-side.

### P0 — Schema markup per page type

| Page | Schema | Status |
|---|---|---|
| `/` | `Organization` + `WebSite` + `SoftwareApplication` (with `offers`) | ✅ |
| `/about` | `AboutPage` + `Person` | ✅ |
| `/$username` | `ProfilePage` + `Person` | ✅ |
| `/how-it-works` | `WebPage` | TODO |

- [ ] Add `WebPage` schema to `/how-it-works` once content is written.

### P0 — AI search readiness (GEO)

- [x] `/llms.txt` at root: brand description, key URLs, content licensing — 3rd-person voice.
- [x] `robots.txt`: explicitly `Allow` GPTBot, PerplexityBot, ChatGPT-User, Google-Extended, ClaudeBot and others. Disallow `/api/`, `/dashboard`, `/settings/`, `/admin`, `/onboarding`, `/login`.
- [x] Marketing page content present in **initial HTML response** — verified for `/` and `/about`.
- [x] Hero body now mentions "PStrack" by name: *"PStrack helps you stay consistent with LeetCode — solve one problem a day, earn points, and compete with your study group."* (2026-06-10)

### P0 — Dynamic OG images

- [x] `/api/v3/og?title=...` — Satori-based PNG endpoint using Geist 400/600 fonts. `createSeoHead()` now generates per-page OG URLs automatically. Renders 1200×630 dark-background card with title + PStrack brand.

### P1 — Core Web Vitals targets

- [ ] LCP < 2.5s
- [ ] INP < 200ms
- [ ] CLS < 0.1

### P1 — Standard infrastructure

- [x] Dynamic sitemap at `/sitemap.xml` — TanStack Start server route queries public groups (≥5 members, active in 30 days) + public user profiles. Static entries: `/`, `/problems`, `/groups`, `/badges`, `/about`, `/how-it-works`.
- [x] Canonical tags on every indexable page — `createSeoHead()` in `src/lib/seo.ts` emits canonical for every route that calls it.
- [x] Open Graph + Twitter cards — meta tags wired via `createSeoHead()`. OG image is now dynamic per-page via `/api/v3/og`.
- [x] Vercel Analytics — `<Analytics />` added to root document shell (2026-06-10).
- [ ] 404 handling — `NotFoundPage` exists in `src/components/not-found.tsx` but not reviewed for crawler signals (proper 404 status code, useful internal links).
- [ ] GSC + Bing Webmaster Tools verification — blocked on production domain DNS.

### P1 — MDX content pages

- [x] `@mdx-js/rollup` installed + wired in `vite.config.ts`. MDX files are supported in `src/content/`.
- [x] `/how-it-works` — MDX content at `src/content/how-it-works.mdx` (placeholder, TODO: write copy).
- [ ] Migrate `/about` prose to MDX — currently JSX with placeholder TODOs; can import MDX file same pattern as `/how-it-works`.

---

## 6. Phased Roadmap

### Phase 1 — Foundation (weeks 1-4)

**Goal: shippable marketing site that AI crawlers can read.**

- [x] Enable TanStack Start SSR for all public routes.
- [x] `/`, `/about`, `/how-it-works` (placeholder), `/problems`, `/groups`, `/$username` — all SSR.
- [x] `robots.txt`, `llms.txt` live under `public/`.
- [x] Dynamic sitemap at `/sitemap.xml` (replaces static file).
- [x] Dynamic OG images at `/api/v3/og`.
- [x] Vercel Analytics wired.
- [x] Schema on `/`, `/about`, `/$username`.
- [ ] GSC + Bing verification — blocked on production domain DNS.
- [ ] Write `/about` founder-story prose (~600-1000 words total, 5 sections).
- [ ] Write `/how-it-works` copy (fill in MDX TODOs).

### Phase 2 — Community launch (weeks 5-12)

**Goal: be findable for 3 long-tail keywords by week 12 via community-driven backlinks.**

- [ ] ProductHunt launch
- [ ] Hacker News Show HN
- [ ] r/leetcode post (genuine, not spam — share the accountability system)
- [ ] NeetCode Discord/subreddit presence
- [ ] Public group pages hit quality gate (≥5 members) → auto-indexed via dynamic sitemap

**Leading indicator**: GSC shows ≥20 impressions/day from branded + niche queries by week 8.

### Phase 3 — Programmatic expansion (weeks 13-24)

**Goal: rank for `leetcode study group`.**

- [ ] Public group pages fully populated with real activity data (leaderboard, solve activity)
- [ ] Outreach: dev newsletters (Bytes, Console.dev, TLDR), NeetCode community
- [ ] First quarterly data report (PR-grade content, AI citation magnet)

**Leading indicator**: 3 ranked keywords on page 1.

### Phase 4 — Authority (months 7-12)

**Goal: 5k organic visits/month, NeetCode/LC community recognizes the brand.**

- [ ] Revisit individual problem pages (`/roadmaps/[roadmap]/[slug]`) — only if aggregate stats are meaningful (≥100 solves/problem)
- [ ] `Course` schema on roadmap pages, `Review` on Pro testimonials
- [ ] Annual report ("State of Coding Interview Prep 2026")
- [ ] Guest posts on dev.to, Hashnode

---

## 7. KPI Targets

| Metric | Launch | 3 mo | 6 mo | 12 mo |
|---|---|---|---|---|
| Organic sessions / month | 0 | 200 | 1,500 | 5,000 |
| Ranking keywords (top 100) | 0 | 10 | 50 | 200 |
| Top-10 keywords | 0 | 1 | 5 | 20 |
| Domain Rating (Ahrefs) | 0 | 3 | 10 | 20 |
| Indexed pages | 8 | 30 | 100 | 300 |
| AI citation count (manual checks) | 0 | 1 | 3 | 10 |
| Signup conversion (organic → signup) | — | 3% | 4% | 5% |
| Pro conversion (signup → $5) | — | 1% | 2% | 3% |

---

## 8. Risks & Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| Marketing pages stay SPA at launch | **Resolved** | All public routes now `ssr: true` |
| NeetCode-branded content draws C&D | Low-medium | Use "NeetCode 250" only as roadmap reference (nominative fair use). Don't imply endorsement. |
| LeetCode TOS changes break auto-verification | High (product risk) | Fallback: "manual verify with screenshot" mode |
| Public group pages thin at launch | Medium | Quality gate: noindex groups <5 members or <30 days active |
| Community-only strategy too slow | Medium | If no page-2 rankings by month 6, add a lightweight MDX content track (3-5 posts, high intent) |

---

## 9. What to Skip / Defer

- **Blog** — cut. Community seeding replaces it. Revisit at month 6 if community traction is insufficient.
- **Comparison pages** — cut. Not enough unique data to avoid thin-content penalty at launch.
- **Individual problem pages** (`/roadmaps/[roadmap]/[slug]`) — deferred to Phase 4. Need real aggregate stats to be non-thin.
- **FAQ schema** — restricted to gov/health for Google rich results since Aug 2023.
- **Local SEO, hreflang, e-commerce schema** — not applicable.
- **Paid SEO tools** (Ahrefs $99+/mo) — defer until month 4. Use GSC + Bing Webmaster + free tools until then.

---

## Next Steps

- [x] SSR all public routes — done 2026-06-10.
- [x] Dynamic OG images via `/api/v3/og` — done 2026-06-10.
- [x] Dynamic sitemap — done 2026-06-10.
- [x] Vercel Analytics — done 2026-06-10.
- [x] Hero brand mention — "PStrack" now in hero body text.
- [x] MDX infrastructure + `/how-it-works` placeholder — done 2026-06-10.
- [ ] Write `/about` founder-story prose (5 sections, ~600-1000 words).
- [ ] Write `/how-it-works` copy (fill MDX TODOs).
- [ ] Update AGENTS.md "TanStack Start (SPA, no SSR)" line — no longer accurate.
- [ ] GSC + Bing Webmaster Tools verification on launch day.
- [ ] Add `WebPage` schema to `/how-it-works` once copy is written.
