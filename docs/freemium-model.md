# Freemium Business Model

## Pricing Tiers

### Free Tier

**Target**: Casual users, students, hobbyists  
**Price**: $0/month

#### Features

- ✅ Join 1 public group
- ✅ Daily problem tracking
- ✅ Basic profile (text-only, no avatar uploads)
- ✅ View top 50 leaderboard
- ✅ Submit solutions (max 5/month)
- ✅ Comment on solutions (max 10/month)
- ✅ 2 pauses per month
- ✅ Email notifications (daily digest only)
- ✅ Access to resources page
- ❌ No detailed analytics
- ❌ Ads displayed (minimal, non-intrusive)

---

### Premium Tier

**Target**: Serious learners, interview preppers  
**Price**: $7/month or $70/year (save 17%)

#### Features

- ✅ Everything in Free
- ✅ **Join up to 5 groups** (compare progress across groups)
- ✅ **Create private groups** (limit 3, invite friends)
- ✅ **4 pauses per month** + **1 streak freeze**
- ✅ **Custom avatar uploads** (processed with Sharp)
- ✅ **Unlimited solutions & comments**
- ✅ **Detailed analytics dashboard**:
  - Topic weakness analysis (based on NeetCode categories)
  - Time-to-solve trends
  - Comparison with group average
  - Heatmap calendar (GitHub-style)
  - Historical data (12+ months)
- ✅ **Priority email support** (24-hour response)
- ✅ **Ad-free experience**
- ✅ **Early access** to new features
- ✅ **Premium badge** on profile
- ✅ **Export stats** as PDF/JSON

---

### Team Tier

**Target**: Coding bootcamps, study groups, companies  
**Price**: $25/month per group (up to 50 members)

#### Features

- ✅ Everything in Premium (for all members)
- ✅ **Group admin dashboard**:
  - Member progress tracking
  - Bulk excuse approval
  - Custom point rules per group
  - Weekly progress reports (CSV export)
- ✅ **Custom branding** (group logo, colors)
- ✅ **API access** (webhook integrations)
- ✅ **Private leaderboards** (hide from public)
- ✅ **Dedicated support** (email + video calls)
- ✅ **White-label option** (+$50/month for custom domain)

---

## Conversion Strategy

### Soft Paywalls (Nudge, Don't Block)

#### 1. **Leaderboard Teaser**

- Free users see top 50 only
- Show "Upgrade to see full leaderboard" at bottom
- **CTA**: "Unlock Your Rank – Go Premium"

#### 2. **Analytics Preview**

- Free users see last 7 days of stats
- Premium: full history + advanced charts
- **CTA**: "See Your Full Progress"

#### 3. **Solution Limit**

- Free: 5 solutions/month
- After hitting limit: "You're on fire! Upgrade to share unlimited solutions"
- **CTA**: "Go Premium"

#### 4. **Avatar Upload**

- Free users see generic avatar
- Prompt: "Stand out with a custom avatar"
- **CTA**: "Upload Avatar (Premium)"

---

### Free Trial

- **14-day free trial** of Premium for new signups
- Auto-converts to Free after trial (no credit card required)
- **Email drip campaign** during trial:
  - Day 3: Feature spotlight (analytics)
  - Day 7: "You're halfway through your trial"
  - Day 12: "2 days left – here's what you'll miss"

---

### Referral Program

- **Refer a friend**:
  - Both get **1 month Premium free**
  - Referrer: +100 bonus coins
  - Referee: +50 bonus coins
- **Unlimited referrals** (no cap on free months)

---

### Seasonal Promotions

- **Black Friday**: 50% off annual plan ($35/year)
- **New Year**: "New Year, New Streak" – first month free
- **Student Discount**: 50% off with .edu email verification

---

## Revenue Projections (Year 1)

### Assumptions

- **1,000 free users** by Month 6
- **5% conversion rate** to Premium (50 paid users)
- **2 team tier** customers by Month 12

### Monthly Revenue (Month 12)

| Tier | Users | Price | Revenue |
|------|-------|-------|---------|
| Free | 950 | $0 | $0 |
| Premium | 50 | $7 | $350 |
| Team | 2 | $25 | $50 |
| **Total** | **1,002** | | **$400/month** |

### Annual Revenue (Year 1)

- MRR growth: $0 → $400/month
- Annual subscriptions: ~10 users × $70 = $700
- **Total**: ~$2,500 in Year 1

### Year 2 Targets

- 10,000 free users
- 500 premium users (5% conversion)
- 10 team tier customers
- **MRR**: $3,750/month (~$45k/year)

---

## Retention Strategies

### For Free Users

- **Email drip campaign**:
  - Week 1: Getting started guide
  - Week 2: "Join a group to boost motivation"
  - Week 4: "You're in the top 30%! Upgrade to track progress"
- **In-app prompts**:
  - After 7-day streak: "Unlock streak freeze with Premium"
  - After solving 30 problems: "See your full stats"

### For Premium Users

- **Monthly recap email** (stats, achievements)
- **Exclusive features** released quarterly
- **Community spotlight** (feature top users on blog/Twitter)
- **Annual renewal discount**: Pay for 12 months, get 2 free

---

## Churn Reduction

### Exit Surveys

- When user cancels, ask why:
  - Too expensive?
  - Not using features?
  - Technical issues?
- **Offer 50% discount** for 3 months to win back

### Downgrade Option

- Premium → Free (keep all data, just lose access)
- "Pause subscription" for 3 months (for students during exams)

---

## Upsell Opportunities

### In-App Prompts

- **After hitting free tier limit**: "You've used all 5 solutions this month. Upgrade to share unlimited."
- **When creating 2nd group**: "Create unlimited private groups with Premium"
- **After 30-day streak**: "Protect your streak with a freeze (Premium feature)"

### Email Campaigns

- **Weekly digest**: Include "Premium Tip of the Week"
- **Milestone emails**: "You've solved 100 problems! Here's what Premium can do for you..."

---

## Metrics to Track (PostHog)

### Conversion Funnel

1. Signup → Email verified
2. Email verified → Solved first problem
3. Solved first problem → Joined group
4. Joined group → 7-day retention
5. 7-day retention → Premium trial started
6. Premium trial → Paid conversion

### Key Metrics

- **Free-to-Premium conversion rate** (target: 5%)
- **Trial-to-Paid conversion rate** (target: 25%)
- **Churn rate** (target: <10% monthly)
- **LTV:CAC ratio** (target: 3:1)
- **MRR growth rate** (target: 20% month-over-month)

---

## Pricing Experiments (A/B Tests)

### Test 1: Price Points

- **Variant A**: $5/month (current)
- **Variant B**: $7/month
- **Variant C**: $9/month
- **Measure**: Conversion rate × revenue per user

### Test 2: Annual Discount

- **Variant A**: 17% off ($70/year)
- **Variant B**: 30% off ($60/year)
- **Measure**: % of users choosing annual

### Test 3: Free Trial Length

- **Variant A**: 7 days
- **Variant B**: 14 days (current)
- **Variant C**: 30 days
- **Measure**: Trial-to-paid conversion

---

## Future Monetization Ideas

### 1. **One-Time Purchases**

- Custom badges ($2.99)
- Lifetime streak freeze ($9.99)
- Profile themes ($4.99)

### 2. **Coaching/Courses**

- "Crack the Coding Interview" course ($49)
- 1-on-1 mock interviews ($20/session)
- Group coaching (4-week program, $199)

### 3. **B2B Partnerships**

- White-label for bootcamps ($500/month)
- Corporate training packages ($1,000/month for 100 employees)

### 4. **Marketplace**

- Premium users can sell their solution explanations ($1-5 each)
- pstrack takes 30% commission

### 5. **Job Board** (Future)

- Companies pay to post jobs ($299/listing)
- Target users with strong streaks
- Revenue share with successful placements
