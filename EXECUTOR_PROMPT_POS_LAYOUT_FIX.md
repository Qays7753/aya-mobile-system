# Aya Mobile — POS Layout & Dimensions Fix Wave

> **Authority Declaration**: This document is the **sole authoritative source** for this execution wave. It supersedes all prior execution reports, live trackers, and verification matrices. Any conflict between this prompt and any other file in the repository resolves in favor of **this prompt**. Agents execute without requesting clarification.

---

## Executive Summary

This wave fixes **11 dimension, sizing, and responsiveness defects** in the POS (Point of Sale) page (`/pos`). The POS is the primary revenue-generating interface — it must be **fixed-position** (no scrolling), **fast to operate**, and **usable across laptop, tablet, and phone**. Current implementation has viewport overflow, collapsed cart hiding the action button, broken sticky declarations, and poor tablet breakpoints.

**Design Principle**: A POS terminal is like an ATM — everything must be visible at once, nothing scrolls off-screen, and the primary action button is always reachable.

---

## System Context

| Item | Location |
|---|---|
| Global CSS | `app/globals.css` (~4820 lines) |
| POS workspace | `components/pos/pos-workspace.tsx` |
| POS CSS variables | `:root` block lines 68–70 |
| POS layout rules | lines ~4141–4703 |
| Dashboard shell rules | lines ~3866–3880 |
| Media queries | `max-width: 1023px` (line ~4699), `max-width: 767px` (line ~4705) |

---

## Global Rules

1. **No npm dependencies added or removed.**
2. **No database schema changes.**
3. **No changes to API routes.**
4. **No changes to business logic** in stores or hooks.
5. **TypeScript must compile clean**: `npx tsc --noEmit --pretty false` → zero errors.
6. **All existing tests must pass**: `npx vitest run`.
7. **Build must succeed**: `npm run build` → no Error lines.
8. **Read every file before modifying it.**
9. **Light theme only.** Zero dark mode CSS.
10. **RTL is native.** Every layout decision must be RTL-correct.
11. **Do not rewrite or restructure components.** This wave is surgical: change CSS values, fix one TSX state initializer.
12. **Do not change any text content, labels, or Arabic strings.**
13. **Do not touch color tokens or design tokens** — those were already fixed in the Visual Overhaul wave.
14. **Commit and push to git when done.** Use commit message format: `fix(pos): <description>`.

---

## Part 1 — Cart Width Too Narrow on Laptop

### 1.1 Problem

**File:** `app/globals.css` — `:root` block (line ~69)

```css
--pos-cart-width: min(320px, 30vw);
```

On a 1366px laptop: `30vw = 410px`, so it picks `320px`. This is too narrow for the checkout form (payment fields, discount, notes, customer info). Professional POS systems (Square, Shopify POS, Lightspeed) use 360–400px minimum cart width.

### 1.2 Fix

```css
/* Change from: */
--pos-cart-width: min(320px, 30vw);
/* To: */
--pos-cart-width: clamp(320px, 30vw, 400px);
```

This gives 320px minimum, scales with viewport, caps at 400px.

---

## Part 2 — `.pos-layout` Height Doesn't Account for Dashboard Content Padding

### 2.1 Problem

**File:** `app/globals.css` (line ~4145)

```css
height: calc(100vh - var(--topbar-height));
```

The `.dashboard-content` wrapper has `padding: 0 var(--sp-6) var(--sp-6)` and `gap: var(--sp-6)`. The POS layout calculates height only subtracting the topbar, but the content wrapper adds bottom padding (`--sp-6` = 24px), causing the POS to overflow vertically by that amount, creating an unwanted scroll.

### 2.2 Fix

The POS should fill its container exactly. Override the dashboard-content padding when in POS mode:

```css
/* ADD this new rule — after the .dashboard-shell--pos block (after line ~4139): */
.dashboard-layout--pos .dashboard-content,
.dashboard-shell--pos .dashboard-content {
  padding: 0;
  gap: 0;
  overflow: hidden;
}
```

This ensures `.pos-layout` fills the entire available area without the dashboard padding pushing it past the viewport.

---

## Part 3 — Cart Panel Sticky Is Dead Code

### 3.1 Problem

**File:** `app/globals.css` (lines ~4318–4325)

```css
.pos-cart-panel,
.transaction-stack--sticky {
  position: sticky;
  top: 0;
  align-self: start;
  height: calc(100vh - var(--topbar-height));
  overflow: hidden auto;
}
```

Inside `.pos-layout` (which has `overflow: hidden` and a fixed height), `position: sticky` does nothing — sticky requires a scrollable ancestor. The `align-self: start` is also meaningless in a single-row grid with explicit height. This is dead CSS that adds confusion.

### 3.2 Fix

Remove `position: sticky`, `top: 0`, and `align-self: start`. Keep the height and overflow:

```css
.pos-cart-panel,
.transaction-stack--sticky {
  height: calc(100vh - var(--topbar-height));
  overflow: hidden auto;
}
```

---

## Part 4 — POS Topbar Sticky Is Dead Code

### 4.1 Problem

**File:** `app/globals.css` (lines ~4162–4174)

```css
.pos-topbar {
  /* ... */
  position: sticky;
  top: 0;
  z-index: calc(var(--z-base) + 2);
}
```

`.pos-topbar` is inside `.pos-products` which uses `grid-template-rows: auto 1fr`. The topbar sits in the `auto` row — it never scrolls away. `position: sticky` is unnecessary and the elevated `z-index` creates stacking complexity for no benefit.

### 4.2 Fix

Remove `position: sticky`, `top: 0`, and reduce z-index:

```css
.pos-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  background: var(--aya-panel);
  border-bottom: 1px solid var(--aya-line);
  min-height: 48px;
  z-index: 1;
}
```

---

## Part 5 — Product Cards Stretch Too Wide on Large Screens

### 5.1 Problem

**File:** `app/globals.css` (line ~4218)

```css
grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
```

On 1920px+ screens, each card stretches to 300px+ — too wide, wastes space, looks empty.

### 5.2 Fix

Cap the maximum card width:

```css
/* Change from: */
grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
/* To: */
grid-template-columns: repeat(auto-fill, minmax(130px, 200px));
```

---

## Part 6 — Duplicate `.pos-layout` Definition

### 6.1 Problem

`.pos-layout` is defined in two places:

- **Line ~3373:** `font-size: var(--pos-body-size);`
- **Line ~4141:** `display: grid; grid-template-columns: ...`

### 6.2 Fix

Merge them. Remove the rule at line ~3373 and add `font-size` to the main definition:

**Step 1:** Delete this block (around line 3373):
```css
.pos-layout {
  font-size: var(--pos-body-size);
}
```

**Step 2:** Add `font-size` to the main `.pos-layout` block (line ~4141):
```css
.pos-layout {
  display: grid;
  grid-template-columns: 1fr var(--pos-cart-width);
  grid-template-rows: 1fr;
  height: calc(100vh - var(--topbar-height));
  overflow: hidden;
  font-size: var(--pos-body-size);
}
```

---

## Part 7 — Cart Sheet Starts Collapsed on Mobile — Action Button Hidden

### 7.1 Problem

**File:** `components/pos/pos-workspace.tsx` (line ~252)

```tsx
const [isCartSheetExpanded, setIsCartSheetExpanded] = useState(false);
```

On mobile/tablet (`max-width: 1023px`), the cart becomes a bottom sheet. When `isCartSheetExpanded = false`, the sheet is collapsed to 56px (just the summary handle). The "تأكيد البيع" button is hidden inside. Users must tap the handle first, then tap the button — an extra step that slows down the primary revenue action.

**POS Best Practice:** The primary action button must always be visible without extra interaction.

### 7.2 Fix

Change the initial state to `true`:

```tsx
/* Change from: */
const [isCartSheetExpanded, setIsCartSheetExpanded] = useState(false);
/* To: */
const [isCartSheetExpanded, setIsCartSheetExpanded] = useState(true);
```

This ensures the cart sheet starts expanded on mobile, showing the items and action button immediately. Users can still collapse it by tapping the handle if they want to see more products.

---

## Part 8 — No Tablet Portrait Optimization (768–1023px)

### 8.1 Problem

The media queries jump from 1023px (single column + cart sheet) to 767px (phone). Tablet portrait (768–1023px) gets the same experience as a phone, despite having enough screen width for a side cart.

### 8.2 Fix

Change the compact breakpoint from 1023px to 767px so that tablets in portrait mode still get the two-column layout with a narrower cart:

**File:** `app/globals.css` — replace the existing `@media (max-width: 1023px)` block for `.pos-layout`:

```css
/* Change from: */
@media (max-width: 1023px) {
  .pos-layout {
    grid-template-columns: 1fr;
  }
}

/* To: */
@media (max-width: 767px) {
  .pos-layout {
    grid-template-columns: 1fr;
  }
}
```

**File:** `components/pos/pos-workspace.tsx` — update the matchMedia breakpoint (line ~491):

```tsx
/* Change from: */
const compactQuery = window.matchMedia("(max-width: 1023px)");
/* To: */
const compactQuery = window.matchMedia("(max-width: 767px)");
```

This means:
- **≥768px** (tablet portrait and above): two-column layout with side cart
- **<768px** (phone): single column with bottom sheet cart

---

## Part 9 — Product Grid Double Padding

### 9.1 Problem

**File:** `app/globals.css`

`.pos-products__content` (line ~4158) has `padding: var(--sp-3)`, and `.pos-product-grid` (line ~4221) also has `padding: var(--sp-3)`. This creates double padding (24px + 24px = 48px) around the product grid.

### 9.2 Fix

Remove padding from `.pos-product-grid` since the parent already provides it:

```css
.pos-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 200px));
  gap: var(--sp-2);
  overflow-y: auto;
  /* Remove: padding: var(--sp-3); */
}
```

---

## Part 10 — `.pos-products__header` Sticky Conflict

### 10.1 Problem

**File:** `app/globals.css` (line ~4203)

```css
.pos-products__header {
  position: sticky;
  top: 0;
  z-index: calc(var(--z-base) + 2);
  /* ... */
}
```

Similar to Part 4 — this header is positioned sticky but the parent `.pos-products__content` has `overflow: auto`, which makes it a scroll container. However, `.pos-products__header` is **outside** `.pos-products__content` (it's a sibling in the grid), so sticky serves no purpose here.

### 10.2 Fix

Remove the sticky positioning:

```css
.pos-products__header {
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3);
  background: var(--aya-panel);
  border-bottom: 1px solid var(--aya-line);
}
```

---

## Part 11 — Cart Panel Height Should Match Grid Cell, Not Viewport

### 11.1 Problem

After Part 2 fix (removing dashboard-content padding for POS), the `.pos-layout` height is `calc(100vh - var(--topbar-height))`. The `.pos-cart-panel` has the same explicit height. But since the cart is inside a grid cell that already has this height, the explicit height is redundant and could cause issues if the topbar height changes.

### 11.2 Fix

Change cart panel to fill its grid cell instead of calculating viewport:

```css
.pos-cart-panel,
.transaction-stack--sticky {
  height: 100%;
  overflow: hidden auto;
}
```

---

## Verification Checklist

Run these commands after all changes. Every check must pass.

```bash
# AC-1: TypeScript clean
npx tsc --noEmit --pretty false
# Expected: zero output

# AC-2: All tests pass
npx vitest run
# Expected: all pass

# AC-3: Build succeeds
npm run build
# Expected: no Error lines

# AC-4: No sticky in cart panel
grep -n "position: sticky" app/globals.css | grep -i "cart-panel\|transaction-stack--sticky"
# Expected: 0 results

# AC-5: No sticky in pos-topbar
grep -A2 "\.pos-topbar {" app/globals.css | grep "position: sticky"
# Expected: 0 results

# AC-6: Cart width uses clamp
grep "pos-cart-width" app/globals.css | grep "clamp"
# Expected: 1 result

# AC-7: Product grid maxes at 200px
grep "pos-product-grid" app/globals.css -A3 | grep "200px"
# Expected: 1 result

# AC-8: Dashboard content padding zeroed for POS
grep -A3 "dashboard-shell--pos .dashboard-content" app/globals.css | grep "padding: 0"
# Expected: 1 result

# AC-9: Cart sheet starts expanded
grep "isCartSheetExpanded.*useState" components/pos/pos-workspace.tsx | grep "true"
# Expected: 1 result

# AC-10: Compact breakpoint is 767px
grep "max-width: 1023px" app/globals.css | grep "pos-layout"
# Expected: 0 results (old breakpoint removed)

grep "max-width: 767px" components/pos/pos-workspace.tsx
# Expected: 0 results from grep (it's in JS not CSS), check the matchMedia line manually

# AC-11: No duplicate .pos-layout font-size block
grep -c "font-size: var(--pos-body-size)" app/globals.css
# Expected: exactly 1 (inside main .pos-layout block only)
```

---

## Execution Order

1. Read `app/globals.css` and `components/pos/pos-workspace.tsx` fully before any edits.
2. Apply Part 1 (cart width clamp)
3. Apply Part 2 (dashboard-content padding override)
4. Apply Part 3 (remove cart panel sticky)
5. Apply Part 4 (remove topbar sticky)
6. Apply Part 5 (product card max width)
7. Apply Part 6 (merge duplicate pos-layout)
8. Apply Part 7 (cart sheet starts expanded) — **this is in `.tsx`**
9. Apply Part 8 (tablet breakpoint) — **both CSS and TSX**
10. Apply Part 9 (remove product grid double padding)
11. Apply Part 10 (remove products header sticky)
12. Apply Part 11 (cart panel height 100%)
13. Run verification checklist (AC-1 through AC-11)
14. Commit with message: `fix(pos): resolve layout dimensions, breakpoints, and cart visibility`
15. Push to git: `git push origin main`

---

## Post-Execution Report

After completing all fixes, create a file `POS_LAYOUT_FIX_REPORT_2026-03-28.md` with:
- Summary of changes made
- AC-1 through AC-11 results (pass/fail)
- Any deviations from instructions with explanation
- Files modified list

---

## Acceptance Criteria Summary

| AC | Criterion | How to verify |
|---|---|---|
| AC-1 | TypeScript compiles clean | `npx tsc --noEmit --pretty false` → 0 errors |
| AC-2 | All tests pass | `npx vitest run` → all pass |
| AC-3 | Build succeeds | `npm run build` → no errors |
| AC-4 | No sticky on cart panel | grep returns 0 |
| AC-5 | No sticky on pos-topbar | grep returns 0 |
| AC-6 | Cart width uses clamp | grep finds clamp |
| AC-7 | Product grid caps at 200px | grep finds 200px |
| AC-8 | Dashboard padding zeroed for POS | grep finds padding: 0 |
| AC-9 | Cart sheet starts expanded | useState(true) |
| AC-10 | Compact breakpoint moved to 767px | No 1023px for pos-layout |
| AC-11 | Single .pos-layout font-size definition | Count = 1 |
