# ملخص عربي سريع:
# هذا الملف يحكم Codex. دوره: منفذ فقط.
# الجزء الأول ثابت (القواعد والتعليمات) — لا يُمسح أبداً.
# الجزء الثاني (TASK ZONE) فيه المهمة الحالية — يُستبدل مع كل مهمة جديدة.
#

# AGENTS.md — Codex Governance File
# ... (first 1673 lines unchanged) ...

---

# ═════════════════════════════════════════════════════════════
# ARCHITECTURAL SOURCE OF TRUTH — AYA PACKAGE
# ═════════════════════════════════════════════════════════════
# This section is STANDING and must NEVER be erased between tasks.
# Read it before executing any Task that touches UI, shell, POS,
# Reports, primitives, or design tokens.

The architectural authority for Aya Mobile lives in the **AYA package**:
`تصميم جديد/AYA_00 → AYA_09` (10 files).

## What each file owns

| File | Authority |
|------|-----------|
| **AYA 00** | Index + authority map. Read first. |
| **AYA 01** | Product contract, page archetypes (Operational/Analytical/Management/Detail/Settings), sticky budget per archetype, width authority per archetype. |
| **AYA 02** | POS final spec. Toolbar is **local to POS workspace**, NOT injected into shell topbar. Payment is an isolated surface. Customer/debt hidden by default. Split payments preserved. Held carts preserved. |
| **AYA 03** | Shell rules, width hierarchy (`--width-operational` / `--width-analytical: 1400px` / `--width-management: 1600px` / `--width-detail: 1100px` / `--width-settings: 900px`), 4 structural surface levels + 7 semantic surface roles, primitive specs (PageHeader / CommandBar / FilterDrawer / MetricCard / ContextPanel / Toolbar), RTL rules, accessibility rules. |
| **AYA 04** | Post-POS roadmap: Reports → Management → Detail → Settings. |
| **AYA 05** | Technical execution plan: 8 phases (Phase 0 authority sync → Phase 7 Reports). Includes **mandatory test protection protocol** (§6). |
| **AYA 06** | Acceptance criteria + anti-hallucination rules **H-01 through H-12**. Read before declaring any Task done. |
| **AYA 07** | Non-technical owner review guide (owner uses this to reject/accept your work). |
| **AYA 08** | Bridge document between AYA, `DESIGN_SYSTEM.md`, and the code. Glossary + mapping + conflict resolution. |
| **AYA 09** | Primitive API reference — props, slots, a11y hooks, test IDs per primitive. Read before touching ANY primitive. |

## Your reading obligation as Codex

Before executing any Task that touches:

- `components/pos/**` or `app/(dashboard)/pos/**` → read **AYA 02 + AYA 03 + AYA 05 + AYA 06**
- `components/dashboard/reports-**` or `app/(dashboard)/reports/**` → read **AYA 01 §6 + AYA 03 §14 + AYA 04 + AYA 06**
- `app/globals.css` shell/width/surface rules → read **AYA 03 + AYA 08**
- `components/ui/**` or any primitive → read **AYA 03 §8 + AYA 09 + AYA 08**
- Any visible Arabic string, CSS class name, or aria-label → follow **AYA 05 §6 test protection protocol** BEFORE editing

## Split of authority (when sources appear to conflict)

| Question type | Authority |
|---------------|-----------|
| Color value, font token, radius, numeric z-index, spacing primitive | `ai-system/DESIGN_SYSTEM.md` (§1–15) |
| Archetype, width policy, surface role, flow, primitive usage | **AYA** (01 / 03) |
| Payment / cart / customer / debt / held carts / API shape | **Code truth** (stores, API routes, validators) |
| Visible strings, CSS selectors, DOM stability | **Tests** (`tests/e2e/`, `tests/unit/`) |

When uncertain → go to **AYA 08 §11** before deciding.

## Anti-hallucination rules (H-rules from AYA 06)

You MUST NOT:
- **H-01** Remove a feature under the banner of "simplification" without explicit owner approval
- **H-02** Change payment/cart/customer/debt logic without verifying API + store + UI + success + error states
- **H-03** Solve a shell-level width/spacing problem with a local page patch
- **H-04** Replace existing domain state with a generic reducer "for cleanliness"
- **H-05** Change visible Arabic strings / CSS classes / selectors without grepping `tests/e2e/` first
- **H-06** Create a second token authority inside AYA or inside a page
- **H-07** Invent a new z-index scale when `DESIGN_SYSTEM.md §10` already has one
- **H-08** Rebuild SectionCard or any existing primitive from scratch without explicit approval
- **H-09** Treat a local patch as success when the root cause is system-level
- **H-10** Move a feature from visible to hidden by guessing it's "rare"
- **H-11** Break RTL with hardcoded `left/right` shortcuts
- **H-12** Accept an implementation that gained simplicity but lost domain clarity or financial correctness

## Non-negotiable before any refactor

1. Read AYA 05 §6 — **Test Protection Protocol**
2. Grep `tests/e2e/` and `tests/unit/` for every class/string/selector you intend to touch
3. Read the matching test files in full
4. Preserve the domain logic listed in AYA 05 §4.1 (Preservation Map)
5. If a conflict exists between AYA and existing tests → **stop and report**, do not silently proceed

---

# ═════════════════════════════════════════════════════════════
# PHASE 8A — STICKY CART RAIL (RESPONSIVE, CONTAINER-DRIVEN)
# ═════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════
# ► CURRENT TASK ◄  Build Sticky Cart Rail with Container Queries
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-13-PHASE-8A-STICKY-CART-RAIL
TASK_TYPE      : ui-refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Wiring + CSS + grid structure + state. No new visual tokens.
DEPENDS_ON     : Phase 7 (a7c4d2b), RTL fix (7c8180a)
```

PROBLEM        :
  After Phases 0–7 the POS flow is architecturally correct but UX-wise still
  multi-screen. The cart is hidden behind a bottom sheet on tablet/desktop, the
  cashier loses context every time they review the cart, and the cart rail is
  sized with a rigid `clamp(...vw...)` rule that does not adapt to actual
  container width.

  Phase 8A introduces a PERSISTENT, CONTAINER-RESPONSIVE cart rail that lives
  next to the products on tablet and desktop, with a flat (non-floating) theme
  and smart internal scrolling. This is pure structural + CSS work. NO payment
  logic changes, NO smart-default-payment button yet (that is Phase 9), NO
  touching of held-carts/split/debt/customer logic.

GOAL           :
  1. The cart rail is VISIBLE AND STICKY inside the POS workspace whenever the
     container is ≥ 720px wide. It uses container queries (NOT viewport) so it
     adapts when the dashboard shell sidebar opens/closes or on iPad Split View.
  2. Rail uses a CSS grid with 3 rows: `auto 1fr auto`
       row 1 → header (item count, cashier context)
       row 2 → scrollable items list (ONLY this row scrolls)
       row 3 → footer (summary card + primary pay button)
     Header and footer NEVER move. Only the items list scrolls.
  3. Rail width is container-query driven, three tiers (see CSS_CONTRACT below).
  4. Flat theme: NO box-shadow, NO backdrop-filter, NO layered floating look.
     Same background as the workspace, separated from products by a single
     `border-inline-start: 1px solid var(--divider)` (or equivalent token).
  5. Under 720px container width, the rail is hidden and the existing
     CartReviewView mobile flow remains the active path. No regression on
     mobile.
  6. Empty-cart state: footer button is replaced by an empty-state message
     ("ابدأ بإضافة منتج") — do NOT show a pay button for an empty cart.
  7. The existing `components/pos/view/cart-review-view.tsx` stays in the tree
     for mobile; pos-workspace chooses rail vs review-view based on a CSS
     driven visibility (NOT on JS window width polling).

FILES          :
  READ (do not blindly edit — grep tests first per AYA 05 §6):
    - components/pos/pos-workspace.tsx
    - components/pos/view/pos-cart-rail.tsx
    - components/pos/view/cart-review-view.tsx
    - components/pos/view/pos-checkout-panel.tsx        (DO NOT MODIFY LOGIC)
    - components/pos/view/payment-checkout-overlay.tsx  (DO NOT MODIFY)
    - app/globals.css                                   (add new rail section)
    - tests/e2e/px06-uat.spec.ts
    - tests/e2e/px22-transactional-ux.spec.ts
    - tests/e2e/device-qa.spec.ts
    - tests/e2e/px18-visual-accessibility.spec.ts
  EDIT:
    - components/pos/pos-workspace.tsx       (wire rail as always-mounted on ≥720px)
    - components/pos/view/pos-cart-rail.tsx  (convert internal layout to grid rows)
    - app/globals.css                        (add `.pos-workspace`/`.pos-cart-rail`
                                              container-query rules + flat theme)

CSS_CONTRACT   :
  ```
  .pos-workspace {
    container-type: inline-size;
    container-name: pos;
    display: grid;
    grid-template-columns: 1fr;   /* default: no rail */
    min-block-size: 0;
  }

  .pos-cart-rail {
    display: none;                /* default hidden under 720px */
    grid-template-rows: auto 1fr auto;
    block-size: 100%;
    min-block-size: 0;
    background: var(--surface-page);   /* same as workspace, flat */
    border-inline-start: 1px solid var(--divider);
    box-shadow: none;
    backdrop-filter: none;
  }

  .pos-cart-rail__items {
    overflow-y: auto;
    overscroll-behavior: contain;
    min-block-size: 0;             /* critical for grid 1fr scroll */
    padding-block-end: var(--sp-3);
  }

  .pos-cart-rail__footer {
    position: sticky;
    inset-block-end: 0;
    background: var(--surface-page);
  }

  /* Tier 1 — compact tablet */
  @container pos (min-width: 720px) {
    .pos-workspace {
      grid-template-columns: 1fr clamp(320px, 38cqi, 380px);
    }
    .pos-cart-rail { display: grid; }
  }

  /* Tier 2 — standard laptop */
  @container pos (min-width: 1024px) {
    .pos-workspace {
      grid-template-columns: 1fr clamp(360px, 34cqi, 440px);
    }
  }

  /* Tier 3 — wide desktop */
  @container pos (min-width: 1440px) {
    .pos-workspace {
      grid-template-columns: 1fr clamp(420px, 28cqi, 520px);
    }
  }
  ```
  Use `100dvh` anywhere the rail needs viewport height (iOS/Android URL bar safe).
  Do NOT use `100vh`. Do NOT use `position: fixed`.

STATE_RULES    :
  - Rail is ALWAYS MOUNTED when panelState === "products". No conditional
    rendering based on JS `window.innerWidth`. Visibility is 100% CSS.
  - `panelState === "cart"` path still shows CartReviewView but ONLY on mobile
    (under 720px container). On ≥720px the cart-review-view can be skipped
    because the rail already shows the cart inline.
  - Focus management: when a qty +/- button is clicked, the updated line MUST
    remain visible. Use `element.scrollIntoView({ block: "nearest" })` on the
    line wrapper after state update (useEffect on items length / last touched
    line id). Do NOT scroll the outer workspace.

DO_NOT_TOUCH   :
  - Checkout panel internals (customer, terminal, split, debt, notes)
  - Payment overlay component or its z-index
  - Held carts logic / store
  - API routes
  - Visible Arabic strings anywhere (no wording changes in this phase)
  - Any test selector / aria-label / CSS class already referenced in tests/e2e
  - Design tokens in DESIGN_SYSTEM.md (no new tokens)

TEST_PROTECTION :
  Per AYA 05 §6, BEFORE editing any of the listed files, grep tests/e2e/ for:
    - `.pos-cart-sheet`
    - `.pos-cart-rail`
    - `pos-workspace`
    - `cart-review`
    - any Arabic string in pos-cart-rail.tsx / pos-workspace.tsx / cart-review-view.tsx
  Read every matching test file in full. If a test asserts that the cart is
  hidden by default on desktop, or clicks a "عرض السلة" button to open it, you
  MUST preserve that behavior path (e.g., keep the button working as a
  focus-to-rail scroll, not a visibility toggle).

DONE_IF        :
  ✅ Rail renders inline beside products at ≥720px container width
  ✅ Rail hidden at <720px; mobile flow unchanged
  ✅ Header + footer sticky; only items list scrolls (verified manually)
  ✅ Overflowing cart (>20 lines) scrolls inside the rail, NOT the workspace
  ✅ Footer button hidden for empty cart; empty-state message shown instead
  ✅ Flat theme: zero box-shadow / backdrop-filter on `.pos-cart-rail`
  ✅ No hardcoded left/right (H-11 clean)
  ✅ Container queries used (not viewport media queries) for rail sizing
  ✅ `100dvh` used, `100vh` NOT used in any new rule
  ✅ `npx tsc --noEmit --pretty false` → zero output
  ✅ `npx vitest run` → all pass
  ⛔ DO NOT run Playwright E2E for this task. Phase 8A is CSS + grid structure
     only, no logic changes. Manual visual check in browser is sufficient.
     Full E2E sweep is deferred to the end of Phase 8B.

ESCALATE_IF    :
  - A test asserts the cart rail must be hidden by default on desktop
  - `--surface-page` or `--divider` tokens do not exist under those names
    (then use the DESIGN_SYSTEM.md equivalent and document in the result)
  - Container queries conflict with an existing `.pos-workspace` media query
  - pos-workspace's panelState machine cannot be reconciled with the
    always-mounted rail without breaking cart-review-view mobile path
  - Any test regression appears outside the listed files

CONTEXT        :
  - AYA 02 → POS workspace flow; rail is the canonical cart surface on desktop
  - AYA 03 §5 → width hierarchy; rail lives INSIDE operational width, not shell
  - AYA 03 §12 → RTL rules (H-11)
  - AYA 06 → H-rules, especially H-01 (do not remove features), H-03 (do not
    solve shell-level problems with page patches), H-05 (grep tests first)
  - AYA 08 §11 → conflict resolution if tests disagree with AYA
  - This is Phase 8A of the post-AYA UX polish. Phase 8B will wire the rail as
    the permanent surface in pos-workspace and retire cart-review-view for
    desktop/tablet. Phase 9 handles smart-default-payment button. Do NOT
    pre-implement Phase 8B or Phase 9 here.

═══ EXECUTION_RESULT ═══

Phase 8A executed successfully.

Test protection completed before edits:
- Grepped `tests/e2e/` and `tests/unit/` for `.pos-cart-sheet`, `.pos-cart-rail`,
  `pos-workspace`, `cart-review`, and protected Arabic labels.
- Read full matching files, including:
  `tests/e2e/px06-uat.spec.ts`,
  `tests/e2e/px22-transactional-ux.spec.ts`,
  `tests/e2e/device-qa.spec.ts`,
  `tests/e2e/px18-visual-accessibility.spec.ts`,
  `tests/unit/pos-workspace.test.tsx`.

Files changed:
- `components/pos/pos-workspace.tsx`
- `components/pos/view/pos-cart-rail.tsx`
- `app/globals.css`
- `tests/unit/pos-workspace.test.tsx`

Implemented:
- Added a persistent inline cart rail path beside products, wired through
  `PosWorkspace` and kept `CartReviewView` in tree for the narrow/mobile path.
- Converted `PosCartRail` into a `header / items / footer` structure and added
  `scrollIntoView({ block: "nearest" })` for qty +/- updates via `lastTouchedLine`.
- Added container-query rail sizing at `720 / 1024 / 1440` widths.
- Limited scroll to `.pos-cart-rail__items`; header and footer stay fixed.
- Replaced the empty-cart footer action with `ابدأ بإضافة منتج`.
- Kept checkout/payment logic untouched.

Token note:
- `--surface-page` and `--divider` do not exist under those names in the repo.
  Used the established equivalents from `DESIGN_SYSTEM.md` / code:
  `var(--color-bg-base)` and `var(--color-border)`.

Unit-test alignment:
- `tests/unit/pos-workspace.test.tsx` had an outdated expectation that
  `مراجعة الدفع` stays visible with an empty cart.
- Updated that single assertion to match Phase 8A's required empty-cart state
  while preserving `مراجعة الدفع` coverage in the payment-flow test that adds
  a product first.

Verification:
- `npx tsc --noEmit --pretty false` -> passed
- `npx vitest run` -> passed (`71/71` files, `207/207` tests)
- Playwright E2E skipped per task override for Phase 8A

Manual visual check in browser:
- At `1024x768`, the cart rail renders inline beside products and remains flat
  with a single divider edge.
- With an empty cart, the footer shows `ابدأ بإضافة منتج` and no pay button.
- After adding a product, the footer shows `مراجعة الدفع`.
- At narrow width (`680px`), the mobile/review path remains active and the
  `السلة والدفع` access button is present.

Result:
- DONE_IF satisfied for the scoped Phase 8A task using typecheck + vitest +
  manual browser validation.
