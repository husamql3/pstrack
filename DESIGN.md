# PStrack - Design System

The visual system: tokens, theming, typography, components, motion, and the rules that keep them consistent. All UI work should pick up the rules in this file. Logic/data conventions live in `AGENTS.md`.

The source of truth for tokens is `src/styles.css`. This document explains what's there and how to use it.

---

## 1. Color Tokens

All colors are **semantic CSS variables in OKLCH**, defined in `src/styles.css` under `:root` (light) and `.dark` (dark). Tailwind v4 `@theme inline` directives expose them as utility classes (`bg-primary`, `text-muted-foreground`, etc.).

### Surface & content

| Token | Use |
|---|---|
| `background` / `foreground` | Page background, default text |
| `card` / `card-foreground` | Card surfaces |
| `popover` / `popover-foreground` | Floating surfaces (dropdowns, popovers) |
| `muted` / `muted-foreground` | Tertiary text, subtle backgrounds |
| `border` | Default border color (applied via base layer `* { @apply border-border }`) |
| `input` | Form input borders |
| `ring` | Focus ring color (used at `outline-ring/50`) |

### Brand & emphasis

| Token | Use |
|---|---|
| `primary` / `primary-foreground` | Primary buttons, brand highlights. Emerald-ish (OKLCH green). |
| `secondary` / `secondary-foreground` | Secondary buttons, less-prominent CTAs |
| `accent` / `accent-foreground` | Accent emphasis (currently aliased to primary) |
| `invert` / `invert-foreground` | High-contrast inverted surface (zinc-900 in light, zinc-700 in dark) |

### State

| Token | Backing color | Use |
|---|---|---|
| `destructive` / `destructive-foreground` | Red | Errors, destructive actions |
| `success` / `success-foreground` | `--color-emerald-500` | Success states, positive deltas |
| `warning` / `warning-foreground` | `--color-yellow-500` | Warnings, attention-needed |
| `info` / `info-foreground` | `--color-violet-500` | Informational, neutral notices |

### Sidebar & charts

`sidebar`, `sidebar-foreground`, `sidebar-primary`, `sidebar-accent`, `sidebar-border`, `sidebar-ring` - dedicated tokens for the app sidebar so it can theme independently.

`chart-1` through `chart-5` - a 5-step green ramp for data viz. Use these for any chart series; don't pick raw colors.

### Rules

- **Never hardcode hex/rgb/oklch** in components. Use a token via the Tailwind utility (`bg-primary`, `text-muted-foreground`) or `var(--primary)` in CSS.
- **Never use Tailwind color-name utilities** (`bg-emerald-500`, `text-red-600`) in app code. Those bypass theming and break in dark mode. Exception: chart series via `chart-1`…`chart-5`.
- **Always pair a surface with its foreground.** `bg-card` → `text-card-foreground`; `bg-primary` → `text-primary-foreground`. Don't mix.

---

## 2. Light & Dark Theming

Dark mode uses Tailwind's `@custom-variant dark (&:is(.dark *))`. A `.dark` class on a parent (typically `<html>`) flips the token values; every component automatically restyles because it consumes semantic tokens.

- Theme toggle lives in `src/components/theme-switcher.tsx`.
- **Don't write `dark:` variants for color** - the semantic token already handles it. `bg-card` is correct in both modes. `bg-white dark:bg-zinc-900` is wrong.
- `dark:` variants are fine for *structural* differences (e.g., a border opacity change) that aren't color-token expressible.

---

## 3. Typography

| Token | Value |
|---|---|
| `--font-sans` | `"Geist Variable", sans-serif` (via `@fontsource-variable/geist`) |
| `--font-heading` | aliased to `--font-sans` - headings use Geist too |

- `<html>` has `@apply font-sans` in the base layer, so Geist is the default.
- Use `font-heading` on headings only when you want the alias semantically; functionally it resolves to the same family today.
- No other font families. Don't import Inter, Manrope, etc.

---

## 4. Radius Scale

Base: `--radius: 0.625rem` (~10px). Scale multiplies that base:

| Class | Multiplier | Computed |
|---|---|---|
| `rounded-sm` | 0.6× | ~6px |
| `rounded-md` | 0.8× | ~8px |
| `rounded-lg` | 1.0× | ~10px |
| `rounded-xl` | 1.4× | ~14px |
| `rounded-2xl` | 1.8× | ~18px |
| `rounded-3xl` | 2.2× | ~22px |
| `rounded-4xl` | 2.6× | ~26px |

- **Never use raw px radii** (`rounded-[12px]`). Pick a step on the scale.
- `rounded-full` is still valid for pills and avatars.

---

## 5. Tailwind & Class Composition

- **Tailwind v4** with `@theme inline` - the variables in `styles.css` are the configuration. There is no `tailwind.config.{js,ts}` to edit.
- **Class composition uses `cn()`** from `@/lib/utils`:

  ```tsx
  import { cn } from "@/lib/utils"

  <div className={cn("p-4 rounded-lg", isActive && "bg-primary text-primary-foreground", className)} />
  ```

  Never template-literal class strings or use `clsx`/`classnames` directly - `cn()` is the wrapper.
- **No inline `style={}` for things Tailwind can express.** Inline styles are for dynamic values (e.g., a computed `transform`) only.
- **No arbitrary values** (`text-[13px]`, `p-[7px]`) unless there is a real reason. Pick the closest scale step.

---

## 6. Component Organization

```
src/components/
├── ui/                 ← shadcn primitives (accordion, button, dialog, …)
├── icons/              ← brand/social SVG icons (google-icon, github-icon)
├── common/             ← shared cross-feature components
├── app-header.tsx      ← app-level shells (header, sidebar, search, …)
├── app-sidebar.tsx
├── app-shell.tsx
├── logo.tsx
├── theme-switcher.tsx
└── …
```

- **`src/components/ui/`** - shadcn primitives only. Don't drop bespoke components here. Adding a new primitive means `npx shadcn add <name>`, then it gets generated into `ui/`.
- **`src/components/`** - app-level composed shells (sidebar, header, auth pages, logo). Reusable across features but not generic enough for `ui/`.
- **`src/features/*/components/`** - feature-scoped, atomic. Reading from one feature into another is a smell. (Feature/hook/form conventions live in `AGENTS.md`.)

### Component conventions (visual surface only)

- One file = one component. PascalCase filename matches the named export.
- Use shadcn primitives as the base; don't reach for raw Radix unless `ui/` is missing the wrapper.
- A skeleton (`src/components/ui/skeleton.tsx`) for every async surface - empty grey boxes during load, not spinners on top of stale content.

---

## 7. Motion

Animation library is **`motion`** (the standalone package, *not* `framer-motion`).

```tsx
import { motion } from "motion/react"
```

- Use `motion` for layout transitions, hero/landing flourishes, and modal/sheet entrances if the shadcn primitive doesn't already animate.
- Most shadcn primitives ship with their own CSS-driven animations via `tw-animate-css` - don't double-animate them with `motion`.
- Keep durations short (150–300ms for UI; 400–600ms for hero moments). No infinite ambient loops outside the landing page.
  - **Sanctioned exception:** the Pro badge (`src/components/ui/pro-badge.tsx`, `<ProBadge>`) runs a looping shine to signal Pro status. This is the one deliberate infinite ambient loop outside the landing page — CEO-directed for Pro identity (#241). Do not add others without the same explicit sign-off.
- **Don't install `framer-motion`, `react-spring`, or `gsap`.** `motion` covers it.

---

## 8. Iconography

Primary icon library: **`@tabler/icons-react`**.

```tsx
import { IconLogin, IconUserPlus } from "@tabler/icons-react"

<IconLogin className="size-4" />
```

- **Sizing via Tailwind `size-*`** (default `size-4` ≈ 16px). Don't pass `size={16}` prop.
- **Color inherits from `currentColor`** - don't set `color={…}` on the icon; style the parent's `text-*`.
- `lucide-react` is incidentally present (≤2 files) but is **not** the standard. Don't introduce new lucide imports.
- Brand/social marks (Google, GitHub) live in `src/components/icons/*-icon.tsx` as hand-built SVG components. Use those, not random tabler approximations.

---

## 9. Toast Styling (sileo)

Toasts use **`sileo`** (see `AGENTS.md` for the `sileo.promise` usage rule). The visual customizations are in `src/styles.css`:

- `[data-sileo-title][data-state]` - title text stays neutral; only the badge/icon carries the state color.
- `[data-sileo-description]` - description color set to `oklch(0.552 0.016 285.938)` (muted) to fix sileo's default washed-out look.

When adding new sileo variants or states, extend the rules in `styles.css` - don't inline-style toast content from the call site.

---

## 10. Avatars

Avatars are generated by **`hashvatar`** - a deterministic SVG built from the username hash.

- No file uploads, no S3 bucket, no moderation pipeline.
- Same username → same avatar, always.
- Use the avatar primitive in `src/components/ui/avatar.tsx` (shadcn) as the wrapper; pass the hashvatar SVG as the source.
- **Don't build "upload your photo" UI.** If the product needs custom avatars later, that's a separate ADR.

---

## 11. Accessibility Essentials

Picked up by the base layer in `styles.css`:

- **Focus rings** - `* { @apply border-border outline-ring/50 }`. Don't disable focus rings (no `outline-none` without a replacement).
- **Cursor on interactive elements** - `button:not(:disabled)` and `[role="button"]:not(:disabled)` get `cursor: pointer` automatically.
- **Scrollbars** - `html { scrollbar-width: thin; scrollbar-color: var(--border) transparent }`.

Additional rules:

- Every interactive element needs a visible focus state. shadcn primitives do this by default; preserve it.
- Color is never the *only* signal for state - pair color with text, icon, or shape. (A red border alone is not enough to communicate "error".)
- Form fields get `<Label>` wrappers; never a placeholder-only field.
