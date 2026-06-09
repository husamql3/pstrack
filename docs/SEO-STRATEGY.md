# PStrack SEO Strategy

Pre-launch (Phase 10, beta to 50 users) competitive programming accountability platform. Plan is sized for that reality: foundation now, content compounding through public launch.

---

## 0. Reality Check

Three constraints shape this entire plan. Solve these before chasing rankings.

| Constraint | Why it matters for SEO |
|---|---|
| **TanStack Start runs as SPA, no SSR** (per AGENTS.md stack) | Googlebot can render JS but treats it as second-pass crawl. AI crawlers (GPTBot, PerplexityBot, ChatGPT-User, Google-Extended) mostly **don't execute JS at all**. An SPA marketing site is invisible to LLMs. **Resolution: SSR is in scope for marketing routes (approved 2026-06-09).** |
| **No public URL yet** | Can't run external audits, no GSC property, no backlinks, no CrUX field data. Roadmap below assumes a production domain by end of Phase 1. |
| **Niche tagline + brand-new domain** | Zero domain authority. Topical authority through content is the only realistic growth lever — paid acquisition for a $14 one-time product won't pencil. |

**First principle**: for a freemium dev tool with LTV ~$14, CAC must be near zero. That forces organic + word-of-mouth, which forces SEO + community, which forces **server-rendered marketing pages and a content engine**.

**Falsifiability**: if 90 days after launching the blog the top 5 posts haven't reached page 2 for their primary long-tail keyword, the content thesis is wrong — pivot to community-led growth (Reddit r/leetcode, Discord-first).

---

## 1. Competitive Landscape

### Direct (same job-to-be-done)

| Competitor | What they do | PStrack's wedge |
|---|---|---|
| **LeetCode.com** | The source of truth, has its own streaks/contests | Curated roadmap + groups + accountability — LC's UX is firehose, not guided |
| **NeetCode.io** | The roadmap PStrack uses (NC250) | NeetCode has no streak/group/verification layer — PStrack is *the* social layer on his roadmap |
| **AlgoExpert** ($99+/yr) | Paid course | PStrack is $14 lifetime + free tier; different price point, different value |
| **Codewars** | Gamified katas | Different problem set; no interview prep focus |

### Adjacent (overlap in motivation)

- **Pramp / Interviewing.io** — live mock interviews (top-of-funnel for the same user)
- **daily.dev** — dev habit feed (proven the "daily ritual" thesis works in this audience)
- **Beeminder / StickK / Habitica** — generic accountability (no domain knowledge)

### Keyword gap (opportunities)

None of the above ranks well for these high-intent queries:

| Query | Est. intent | Competition | PStrack fit |
|---|---|---|---|
| `leetcode accountability` | High | Very low | Perfect — own this |
| `leetcode streak tracker` | High | Low | Perfect |
| `neetcode 250 progress tracker` | High | Very low | Perfect |
| `leetcode study group online` | Medium-high | Low | Perfect — group feature |
| `how to be consistent with leetcode` | Med (informational) | Low | Blog territory |
| `daily leetcode challenge` | High | Medium | Possible — needs content |
| `how long does neetcode 250 take` | High (research) | Low | Blog territory |
| `leetcode 100 days challenge` | Med | Low | Brandable — own this term |

**Lateral connection**: NeetCode himself has ~700k YouTube subs. The roadmap brand is a moat — being "the accountability layer for NeetCode 250" is positioning gold. Consider direct outreach for a guest mention once you have testimonials.

---

## 2. Site Architecture

Marketing site (SEO-critical, must be SSR) is **separate concern** from the app shell. Both ship from the same TanStack Start deployment, but marketing routes need server rendering enabled.

```
/                                  ← Homepage: value prop, social proof, CTA
/how-it-works                      ← Daily loop visualized
/pricing                           ← Free vs Pro ($14 lifetime — anti-subscription angle)
/roadmaps                          ← Hub
  /roadmaps/neetcode-250           ← Pillar: full NC250 problem list w/ progress UI
  /roadmaps/neetcode-150           ← Pillar
  /roadmaps/blind-75               ← Pillar
/groups                            ← Discover public groups (SEO landing for "leetcode study group")
  /groups/[slug]                   ← Indexable public group pages (titles, member count, activity)
/blog                              ← Content engine (see §4)
  /blog/[slug]
/compare                           ← Comparison hub
  /compare/pstrack-vs-leetcode-premium
  /compare/leetcode-streak-trackers
  /compare/best-neetcode-companions
/about
/changelog                         ← Fresh-content signal + dev audience appeal
/llms.txt                          ← AI crawler manifest (see §5)
```

**Dependency**: public group pages and roadmap pages are programmatic — one template, many pages. **Quality gate**: enforce ≥60% unique content per group page (description, member count, recent activity, leaderboard snippet) to stay under the thin-content threshold. Cap at 50 indexable group pages until the content moat is built; `noindex` the rest.

---

## 3. Content Strategy

The blog is the moat. Three tracks, decreasing in commercial intent.

### Track A — Bottom-of-funnel (publish first, 4-6 posts pre-launch)

These convert. Each targets a transactional keyword and pitches PStrack at the end.

- [ ] **"How to stay consistent with LeetCode (the 90-day system that works)"** → owns `leetcode consistency`
- [ ] **"NeetCode 250 timeline: how long does it actually take?"** → owns `how long neetcode 250`
- [ ] **"The best LeetCode streak trackers in 2026"** → comparison roundup (PStrack as #1, but honest)
- [ ] **"LeetCode study groups: how to find one (or start your own)"** → owns `leetcode study group`
- [ ] **"Daily LeetCode challenge: a 6-month plan with accountability"** → owns `daily leetcode challenge`
- [ ] **"NeetCode vs Blind 75 vs NeetCode 150: which roadmap should you do?"** → topical authority

### Track B — Middle-of-funnel (publish weeks 4-12)

Educational, builds topical authority and AI-search citability.

- [ ] "How to verify your LeetCode submissions automatically" (your USP — explains the verification job)
- [ ] "Why streaks work for skill-building (the science of habit loops)"
- [ ] "Pause days: how to break a streak without breaking your habit" (your pause feature, framed)
- [ ] Pattern guides: "Sliding window pattern: 12 problems to drill it", one per major NC250 pattern (~15-20 posts, evergreen, AI-citation magnet)

### Track C — Top-of-funnel (publish months 4+)

- [ ] "What is competitive programming, and is it worth it?"
- [ ] "Coding interview prep: the 6-month roadmap I'd follow today"
- [ ] Annual data report: "We analyzed 100,000 LeetCode submissions — here's what we learned" (PR + backlinks + AI citations)

### Cadence

- **Pre-launch**: Track A posts published before opening signups. They need 60-90 days to rank.
- **Months 1-3**: 2 posts/week (Track B + finish Track A)
- **Months 4-12**: 1 post/week + 1 data report/quarter

**Falsifiability**: if `leetcode streak tracker` and `leetcode study group` aren't on page 1 by month 6, the on-page or backlink work is the bottleneck — re-audit.

---

## 4. Programmatic Pages

Two safe programmatic templates. Apply the quality gate.

### Roadmap problem pages

- `/roadmaps/neetcode-250/two-sum`, etc. — one per problem
- Each page: problem name, difficulty, pattern, % of PStrack users who solved it, average time-to-solve from your data, link to LC, "track this in PStrack" CTA
- ~250 pages. **Unique data per page (your aggregate stats) makes them non-thin** — this is the key.
- Schema: `SoftwareApplication` + `BreadcrumbList` per page

### Public group pages

- Per-group URL is indexable when group is public
- Render: name, member count, current daily problem, leaderboard top 5, recent solve activity
- Auto-`noindex` if member count < 5 OR no activity in 30 days (prevents thin-content drift)

**Both templates must be SSR.** No SPA hydration trick — AI crawlers won't see hydrated content.

---

## 5. Technical Foundation

### P0 — SSR for marketing routes (approved)

- [x] TanStack Start supports server rendering per-route. Enable for: `/`, `/how-it-works`, `/pricing`, `/roadmaps/*`, `/blog/*`, `/compare/*`, `/groups/[slug]` (public only). Keep `/dashboard`, `/settings/*`, etc. as SPA.
  - Approach: root flipped to `ssr: true`; auth/admin/app routes opt out with `ssr: false`. `/` and `/about` SSR. Other listed marketing routes don't exist yet — they'll inherit `ssr: true` when created.
  - Better Auth SSR caveat: root `beforeLoad` skips `authClient.getSession()` when `typeof window === "undefined"` (cookie forwarding unsolved). Revisit when SSR'ing authenticated-context routes.

**Verification**: `curl -A "GPTBot" https://pstrack.app/ | grep -c "Show up. Solve. Repeat."` returns ≥1.
  - Verified locally on 2026-06-09: each phrase ("Show up.", "Solve.", "Repeat.") renders in its own h1 via TextEffect — the literal joined string won't match (HTML between), but each phrase is present in the SSR'd HTML.

### P0 — Schema markup per page type

| Page | Schema |
|---|---|
| `/` | `Organization` + `WebSite` + `SoftwareApplication` (with `offers`: free + $14 one-time) |
| `/pricing` | `SoftwareApplication` with both `Offer` entries |
| `/roadmaps/[key]` | `ItemList` (the problems) + `LearningResource` |
| `/blog/[slug]` | `Article` with `author`, `datePublished`, `dateModified` |
| `/compare/*` | `Article` (skip `FAQPage` — Google restricted to gov/health Aug 2023) |

Do **not** ship HowTo schema (deprecated Sept 2023).

- [x] Ship `Organization` + `WebSite` + `SoftwareApplication` schema on `/` — single `@graph` JSON-LD block, with `Offer` entries for both free and $14 lifetime.
- [ ] Ship `SoftwareApplication` with both `Offer` entries on `/pricing` — route doesn't exist yet.
- [ ] Ship `ItemList` + `LearningResource` on `/roadmaps/[key]` — route doesn't exist yet.
- [ ] Ship `Article` schema on `/blog/[slug]` — route doesn't exist yet.
- [ ] Ship `Article` schema on `/compare/*` — route doesn't exist yet.
- [x] Ship `AboutPage` + `Person` schema on `/about` (added beyond the original table; founder narrative scaffold).
- [x] Ship `ProfilePage` + `Person` schema on `/$username` (dynamic from route params).

### P0 — AI search readiness (GEO)

- [x] `/llms.txt` at root: brand description, key URLs, content licensing — 3rd-person voice, lists `/`, `/about`, `/problems`, `/groups`, `/badges` as key URLs.
- [x] `robots.txt`: explicitly `Allow` GPTBot, PerplexityBot, ChatGPT-User, Google-Extended, ClaudeBot — also added OAI-SearchBot, Perplexity-User, Claude-Web, Applebot-Extended, CCBot, Bytespider. Disallow `/api/`, `/dashboard`, `/settings/`, `/admin`, `/onboarding`, `/login`.
- [x] Marketing page content must be present in the **initial HTML response**, not hydrated client-side — verified for `/` and `/about`.
- [ ] Brand mentions: write content in third person for sections likely to be quoted ("PStrack auto-verifies LeetCode submissions by polling the GraphQL API every 2 minutes" reads as a quotable fact) — llms.txt has 3rd-person facts; homepage Hero body still doesn't mention "PStrack" in text. Open follow-up.

### P1 — Core Web Vitals targets

- [ ] LCP < 2.5s (Vercel + SSR + image optimization gets you here)
- [ ] INP < 200ms (your app is interactive but marketing pages should be near-static)
- [ ] CLS < 0.1

### P1 — Standard infrastructure

- [~] XML sitemap with `lastmod` — static `public/sitemap.xml` shipped covering `/`, `/about`, `/problems`, `/groups`, `/badges`. `lastmod` hand-set. Auto-generation (Elysia handler querying public groups + profiles) is still TODO.
- [x] Canonical tags on every indexable page — `createSeoHead()` in `src/lib/seo.ts` emits canonical for every route that calls it. `/` `/about` `/problems` `/groups` `/leaderboard` `/badges` `/login` `/$username` all wired.
- [~] Open Graph + Twitter cards — meta tags wired via `createSeoHead()` (og:title/description/url/image, twitter:card=summary_large_image). `public/og-default.png` placeholder still 404s — drop in a 1200×630 image.
- [ ] 404 handling with helpful links back into the site — `NotFoundPage` exists in `src/components/not-found.tsx` but not reviewed for crawler signals (proper 404 status code, useful internal links).
- [ ] GSC + Bing Webmaster Tools verification day-one — blocked on production domain DNS being set up.

---

## 6. Phased Roadmap

Aligned to the existing Phase 10 (beta to 50 users) milestone.

### Phase 1 — Foundation (weeks 1-4, overlaps with Phase 10 beta)

**Goal: shippable marketing site that AI crawlers can read.**

- [x] Enable TanStack Start SSR for marketing routes — done; see §5 P0 note for details.
- [~] Build `/`, `/how-it-works`, `/pricing`, `/about`, `/blog` (empty index) — `/` shipped (existing); `/about` scaffolded with founder-story skeleton (TODO copy for 5 sections); `/how-it-works`, `/pricing`, `/blog` not built.
- [~] Schema on all marketing pages — `/` and `/about` shipped; `/pricing`, `/how-it-works`, `/blog` blocked on those pages existing.
- [x] `robots.txt`, `llms.txt`, `sitemap.xml` — all three live under `public/`. Sitemap is static for now (5 URLs); see §5 P1 for auto-gen TODO.
- [ ] GSC + Bing verification — blocked on production domain DNS.
- [ ] Vercel Analytics or Plausible (avoid GA4 if possible — privacy + perf) — not started.
- [ ] Write Track A posts 1-3 (publish on launch day) — blocked on `/blog` route existing.

**Falsifiability**: `curl -A "PerplexityBot" https://pstrack.app/pricing` returns the price text in the response body — `/pricing` doesn't exist yet; check holds for when it ships.

### Phase 2 — Content launch (weeks 5-12)

**Goal: be findable for 5 long-tail keywords by week 12.**

- [ ] Publish Track A posts 4-6
- [ ] Begin Track B (2 posts/week)
- [ ] Public roadmap pages live (`/roadmaps/neetcode-250` with full problem list)
- [ ] First comparison page: `/compare/leetcode-streak-trackers`
- [ ] First backlink push: ProductHunt launch, Hacker News Show HN, r/leetcode AMA, NeetCode subreddit
- [ ] Email capture on blog posts (newsletter = retention lever for free users)

**Leading indicator**: GSC shows ≥50 impressions/day from the blog by week 10. If not, on-page SEO or indexation is broken.

### Phase 3 — Programmatic + comparison expansion (weeks 13-24)

**Goal: rank for the head term `leetcode study group`.**

- [ ] Programmatic problem pages (~250 unique data-backed pages)
- [ ] Public group pages indexable with quality gate
- [ ] Track B pattern guides finished (~15-20 evergreen posts)
- [ ] Comparison pages: vs LeetCode Premium, vs AlgoExpert, NeetCode alternative
- [ ] Outreach: dev newsletters (Bytes, Console.dev, TLDR), NeetCode community
- [ ] First quarterly data report (PR-grade content)

**Leading indicator**: 3 ranked keywords on page 1, 10 on page 2.

### Phase 4 — Authority (months 7-12)

**Goal: 10k organic visits/month, NeetCode/LC community recognizes the brand.**

- [ ] Track C top-of-funnel content
- [ ] Annual report ("State of Coding Interview Prep 2026")
- [ ] Guest posts on dev.to, Hashnode, Medium publications
- [ ] Podcast outreach (Syntax.fm, Soft Skills Engineering)
- [ ] Schema upgrade: `Course` schema on roadmap pages, `Review` on Pro testimonials

---

## 7. KPI Targets

Realistic for a $14 LTV product in a niche dev audience. Pad these once you have 30 days of real data.

| Metric | Launch | 3 mo | 6 mo | 12 mo |
|---|---|---|---|---|
| Organic sessions / month | 0 | 500 | 3,000 | 10,000 |
| Ranking keywords (top 100) | 0 | 25 | 100 | 400 |
| Top-10 keywords | 0 | 2 | 10 | 40 |
| Domain Rating (Ahrefs) | 0 | 5 | 15 | 25 |
| Indexed pages | 5 | 40 | 150 | 400 |
| AI citation count (manual checks) | 0 | 1 | 5 | 20 |
| Signup conversion (organic → signup) | — | 3% | 4% | 5% |
| Pro conversion (signup → $14) | — | 1% | 2% | 3% |

---

## 8. Risks & Mitigation

| Risk | Severity | Mitigation |
|---|---|---|
| Marketing pages stay SPA at launch | **Critical** | Block launch on SSR being enabled for `/`, `/pricing`, `/blog/*` |
| NeetCode-branded content draws C&D | Low-medium | Use "NeetCode 250" only as roadmap reference (nominative fair use). Don't imply endorsement. Consider reaching out for a partnership instead. |
| LeetCode TOS changes break auto-verification | High (product risk, SEO-adjacent) | Have a fallback story: "manual verify with screenshot" mode. Owning the limitation is good content. |
| Programmatic group pages bloat index with thin content | Medium | Quality gate already specified: noindex groups <5 members or <30 days active |
| Blog never ranks because dev audience uses Reddit/HN, not Google | Medium | Diversify Phase 2-3: invest in Reddit/HN presence in parallel; treat blog as long compounding play, not the only one |

---

## 9. What to Skip / Defer

- **FAQ schema** — restricted to gov/health for Google rich results since Aug 2023. Not worth implementing for snippet purposes. (Still fine for AI citation, just don't expect SERP impact.)
- **Local SEO, hreflang, e-commerce schema** — not applicable
- **Paid SEO tools** (Ahrefs $99+/mo) — defer until month 4. Use GSC + Bing Webmaster + free Ubersuggest until then.
- **A dedicated docs site** — overkill for a single-purpose app. Keep `/how-it-works` and `/changelog` instead.

---

## Next Steps

- [x] Confirm SSR scope with implementation owner — `/` and `/about` SSR'd; auth/admin/app routes opted out; future marketing routes inherit root `ssr: true`.
- [x] Pick a production domain — `pstrack.app` (already in env defaults and email templates).
- [ ] Run `/seo content-brief "how to stay consistent with leetcode"` to generate the first competitive brief.
- [ ] Drop in a 1200×630 `public/og-default.png` so social preview cards work.
- [ ] Update AGENTS.md "TanStack Start (SPA, no SSR)" line — no longer accurate.
- [ ] Write founder-story prose for the 5 sections in `src/routes/about.tsx` (~600–1000 words total).
- [ ] Decide whether to SSR public routes that are currently opted-out (`/$username`, `/groups`, `/problems`, `/badges`) — head() tags already render, but body content would help crawlers more.
