# Development Timeline

## Phase 1

### Project Setup

- [x] Initialize project
- [x] Configure Turborepo monorepo structure
- [x] Setup Lefthook git hooks (pre-commit, pre-push)
- [x] Configure Oxlint for linting
- [x] Setup Neon databse for `dev`
- [x] Configure Drizzle ORM + migrations
- [x] Setup Supabase (Storage)
- [x] Initialize Upstash Redis + Realtime
- [x] Configure T3-env for environment variables
- [x] Setup Wrangler for Cloudflare deployment
- [x] Configure Sentry error tracking

### Authentication & Database ([#204](https://github.com/husamql3/pstrack/issues/20))

- [x] Deploy client on [cloudflare](https://tanstack.com/start/latest/docs/framework/react/guide/hosting#cloudflare-workers--official-partner)
  - [x] copy the env to the client as well
  - [x] create scripts in the root
- [x] Implement Better-Auth setup
- [x] Create database schema (users, groups, problems, etc.)
- [x] Build signup flow (email verification)
- [x] Build login flow (sessions)
- [x] Setup Sentry error tracking
- [ ] Configure Sentry for tanstack

---

## Phase 2: Core Features (Weeks 3-4)

### Week 3: Daily Problem System

- [ ] Build problem assignment logic
- [ ] Integrate LeetCode GraphQL API
- [ ] Integrate Codeforces API
- [ ] Create submission verification job (Trigger.dev)
- [ ] Build "mark as solved" UI
- [ ] Implement points calculation
- [ ] Create streak tracking logic

**Deliverable**: Daily problems work end-to-end

### Week 4: Groups & Permissions

- [ ] Build group creation flow
- [ ] Implement public/private group logic
- [ ] Create invite link generation
- [ ] Build admin approval system
- [ ] Implement group switching
- [ ] Create group settings page
- [ ] Create user profile CRUD operations

**Deliverable**: Users can create/join groups

---

## Phase 3: Accountability (Weeks 5-6)

### Week 5: Pause & Suspension System

- [ ] Build pause request UI
- [ ] Implement excuse form
- [ ] Create admin approval queue
- [ ] Build suspension automation (Trigger.dev)
- [ ] Implement unexcused miss tracking
- [ ] Create suspension appeal system
- [ ] Build notification system (email via Resend)

**Deliverable**: Accountability mechanisms functional

### Week 6: Notifications

- [ ] Build email templates (React Email)
- [ ] Implement in-app notification panel
- [ ] Setup Upstash Realtime for WebSocket notifications
- [ ] Create React hooks for real-time updates
- [ ] Implement notification bell with unread count
- [ ] Create notification preferences UI
- [ ] Build daily digest job (Trigger.dev)
- [ ] Implement notification batching
- [ ] Add presence indicators (who's online)

**Deliverable**: Users receive timely notifications via email and real-time in-app updates

---

## Phase 4: Community (Weeks 7-8)

### Week 7: Leaderboards & Solutions

- [ ] Build platform leaderboard (Redis sorted sets)
- [ ] Build group leaderboard
- [ ] Create solution submission UI
- [ ] Implement syntax highlighting (Shiki)
- [ ] Build solution voting system
- [ ] Create line-by-line commenting (Monaco Editor)

**Deliverable**: Leaderboards and solutions working

### Week 8: Resources & Feed

- [ ] Build resource submission form
- [ ] Create admin resource approval queue
- [ ] Implement resource voting
- [ ] Build activity feed (with pagination)
- [ ] Create feed filtering
- [ ] Implement Twitter bot for weekly leaderboard

**Deliverable**: Community features live

---

## Phase 5: Polish & Premium (Weeks 9-10)

### Week 9: Admin Dashboard

- [ ] Build admin user management UI
- [ ] Create group management tools
- [ ] Implement content moderation queue
- [ ] Build analytics dashboard (PostHog integration)
- [ ] Create manual override tools
- [ ] Implement ban/suspend actions

**Deliverable**: Admin tools functional

### Week 10: Premium Features

- [ ] Implement Stripe integration
- [ ] Build subscription management
- [ ] Create premium-only features (extra pauses, analytics)
- [ ] Build billing portal
- [ ] Implement team tier features
- [ ] Create upgrade prompts in UI

**Deliverable**: Freemium model implemented

---

## Phase 6: Testing & Launch (Weeks 11-12)

### Week 11: Testing & Optimization

- [ ] Write integration tests (Bun test)
- [ ] Perform load testing (k6 or Artillery)
- [ ] Optimize database queries (add indexes)
- [ ] Implement Redis caching for hot paths
- [ ] Fix critical bugs from testing
- [ ] Setup monitoring dashboards (Sentry + PostHog)

**Deliverable**: Platform stable under load

### Week 12: Launch Preparation

- [ ] Create onboarding flow/tutorial
- [ ] Build landing page (marketing site)
- [ ] Write documentation (user guide, API docs)
- [ ] Configure Cloudflare Workers production deployment
- [ ] Configure Cloudflare Pages production deployment
- [ ] Setup CI/CD with GitHub Actions + Wrangler
- [ ] Configure custom domain (pstrack.tech)
- [ ] Setup Cloudflare DNS and SSL
- [ ] Perform security audit
- [ ] Configure Sentry source map uploads
- [ ] Soft launch to beta testers (50-100 users)

**Deliverable**: Beta launch ðŸš€

---

## Post-Launch (Weeks 13+)

### Immediate Priorities

- [ ] Monitor error rates (Sentry)
- [ ] Track user engagement (PostHog funnels)
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow queries

### Future Features (Backlog)

- [ ] Mobile app (React Native)
- [ ] Discord bot integration
- [ ] Public API for developers
- [ ] Custom problem sets (premium)
- [ ] Video solution explanations
- [ ] 1-on-1 pairing mode
- [ ] Company partnerships (B2B)

---

## Key Milestones

| Week | Milestone          | Success Criteria                       |
| ---- | ------------------ | -------------------------------------- |
| 2    | Auth Working       | Users can signup/login                 |
| 4    | Daily Problems     | Users can solve and get verified       |
| 6    | Notifications      | Users receive emails and in-app alerts |
| 8    | Community Features | Leaderboards and solutions live        |
| 10   | Premium Tier       | Stripe integration complete            |
| 12   | Beta Launch        | 50+ active users                       |

---

## Risk Mitigation

### Technical Risks

- **API rate limits**: Implement aggressive caching, batch requests
- **Cloudflare Workers limits**: Monitor execution time (max 50ms CPU), optimize queries
- **WebSocket connections**: Upstash Realtime handles auto-reconnection, test connection stability

### Product Risks

- **Low engagement**: A/B test onboarding, add more gamification
- **Admin overhead**: Build better auto-moderation tools
- **Payment failures**: Test Stripe webhooks thoroughly

### Timeline Risks

- **Scope creep**: Lock features after Phase 4, move extras to backlog
- **Bugs**: Allocate 20% buffer time for unexpected issues
- **Integration delays**: Test external APIs (LeetCode/CF) early
