# Onboarding Flow

Post-signup flow for new users. Triggered for any authenticated user whose Better Auth session is missing `username` or `leetcodeHandle`.

---

## Route Guard

On every authenticated route, check the session:

- If `username` or `leetcodeHandle` is missing → redirect to `/onboarding`
- If both are present and user navigates to `/onboarding` → redirect to `/dashboard`

---

## Wizard Structure

Two steps. Progress indicator shown throughout. Back navigation is allowed from Step 2 → Step 1.

---

## Step 1 - Profile Setup

**Fields**

| Field             | Required | Pre-fill                                            |
| ----------------- | -------- | --------------------------------------------------- |
| Username          | Yes      | Derived from email local-part or OAuth display name |
| LeetCode handle   | Yes      | Empty                                               |
| Codeforces handle | No       | Empty                                               |

**Validation (all on blur)**

- **Username** - API call to check uniqueness; returns error if taken
- **LeetCode handle** - hit LeetCode's public GraphQL API to confirm the account exists
- **Codeforces handle** - if non-empty, confirm account exists via Codeforces API

**Continue button** - enabled only when username and LeetCode handle have both passed blur validation. Codeforces may be empty.

**On Continue**

- Call Better Auth `updateUser` with `{ username, leetcodeHandle, codeforcesHandle }`
- Session is enriched with updated values
- Advance to Step 2

---

## Step 2 - Join a Group

**Default state** - public groups listed, sorted by member count (descending). Searchable by group name.

**Actions**

| Action                         | Outcome                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| Request to Join (public group) | Join request submitted; advance to `/dashboard` immediately |
| Skip                           | Advance to `/dashboard` immediately                         |

Users cannot create a group from this step - that is a post-onboarding action via `/groups/new`.

---

## Completion

Onboarding is considered complete when `username` and `leetcodeHandle` are present on the Better Auth session (set on Step 1 Continue).

After Step 2 (join request or skip):

- Redirect to `/dashboard`
- Show welcome toast: "Welcome to PStrack!"

---

## Dashboard Nudge

If the user is not a member of any group, show a persistent banner on `/dashboard`:

> You're not in a group yet - you won't receive daily problems until you join one. [Browse groups →]

Banner is dismissed automatically once the user joins a group.
