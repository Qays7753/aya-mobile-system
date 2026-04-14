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
# PHASE 9 — SMART DEFAULT PAYMENT ACTION (9A + 9B + 9C)
# ═════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════
# ► CURRENT TASK ◄  One-tap cash checkout for the common path
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-14-PHASE-9-SMART-DEFAULT-PAYMENT
TASK_TYPE      : feature + ui-refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Store + UI wiring + state reuse. Cart-level payment trigger.
DEPENDS_ON     : Phase 8A (2f3ff16), Phase 8B (pending commit in TASK ZONE)
```

PROBLEM        :
  After Phases 8A/8B, the cart rail is canonical on desktop and always in
  front of the cashier. But the payment flow still forces every sale to pass
  through the payment overlay — even the simplest case (cash sale, no
  customer, no debt, no split, exact total). A routine cash sale currently
  takes roughly six taps:
    1) tap pay button in rail
    2) wait for overlay
    3) select "نقدي" payment method
    4) confirm amount equals total
    5) tap confirm
    6) dismiss success
  For a queue of customers this is friction. The common path should be
  two taps, not six.

  Phase 9 introduces a SMART DEFAULT PAYMENT ACTION in the cart rail
  footer. It remembers the last successful payment method (per device,
  per cashier session) and exposes it as a single primary button that
  completes the sale in one tap for the simple case. A secondary,
  smaller "خيارات دفع" link still opens the full overlay for complex
  cases (debt, split, customer attach, discount, notes).

  This phase has three sub-tasks. Execute them in order, in the same
  session, and report ONE consolidated EXECUTION_RESULT at the end.

GOAL           :

  ─────────────────────────────────────────────────────────────
  Sub-task 9A — Persist last used payment method
  ─────────────────────────────────────────────────────────────
  1. Identify the existing payment-method state source (likely inside the
     POS store or the checkout panel local state). Do NOT create a new
     store. Extend the existing one.
  2. When a sale completes successfully via ANY path (smart button OR
     full overlay), record the payment method used into `localStorage`
     under the key `aya.pos.lastPaymentMethod` — value is the method id
     string (e.g., `"cash"`, `"card"`, `"transfer"`).
  3. On POS mount (or on cart rail mount), read that value. If present
     and still valid (matches a currently supported method id), use it
     as the default. If absent, missing, or invalid → fall back to the
     system default (whatever the checkout panel already uses today;
     likely cash).
  4. DO NOT persist amounts, customer, split details, or notes. Only the
     method id. Everything else resets per sale.
  5. This must work per-device. Do NOT tie it to a user id in this phase.

  ─────────────────────────────────────────────────────────────
  Sub-task 9B — Smart default pay button in the rail footer
  ─────────────────────────────────────────────────────────────
  1. Add a PRIMARY button to the cart rail footer labeled with the
     current default method, in the format: `دفع [method label]` —
     e.g., `دفع نقدي`, `دفع بطاقة`, `دفع تحويل`. Use the existing method
     label strings from the checkout panel. DO NOT invent new strings.
  2. Button is hidden/replaced by the empty-state message when cart is
     empty (preserve Phase 8A behavior).
  3. Clicking the button commits the sale DIRECTLY with these assumptions:
       • payment method = current default
       • paid amount    = cart total (exact, no change)
       • customer       = none
       • debt           = none
       • split          = none
       • discount       = whatever is already on the cart (respect line
                          discounts and invoice discounts already applied
                          — the button does NOT clear them, just does not
                          add new ones)
       • notes          = none
     The flow must be: click → call the SAME sale-commit function the
     overlay uses today → success toast/surface → rail resets for next
     sale. NO overlay opens.
  4. If the sale-commit function fails (network, server error, validation),
     surface the SAME error UI that the overlay currently shows. Do NOT
     swallow errors. Do NOT auto-open the overlay on failure — show the
     error inline near the smart button and let the cashier retry or
     open the overlay manually via the secondary link (9C).
  5. Loading state: while the sale is in flight, the button must show a
     spinner/disabled state and be non-clickable. No double-submission.
  6. On mobile (<720px), the smart button lives in the rail ONLY IF the
     rail is visible. Since 8B keeps the rail hidden on mobile, the
     smart button does NOT appear on mobile — the legacy cart-review-view
     flow stays the mobile path. Do NOT add the smart button to
     cart-review-view.
  7. Accessibility: button must have `aria-label` that includes the
     total amount, e.g., `aria-label="دفع نقدي — الإجمالي 45.00 د.أ"`.
     Use the same currency formatter the rest of the rail uses.

  ─────────────────────────────────────────────────────────────
  Sub-task 9C — Secondary "خيارات دفع" link
  ─────────────────────────────────────────────────────────────
  1. Directly under the primary smart button, add a small SECONDARY
     text link labeled `خيارات دفع أخرى`. Smaller font, less visual
     weight than the primary button.
  2. Clicking it opens the existing full payment overlay (same handler,
     same component, same z-index). No new code path.
  3. When the overlay opens this way, it shows the SAME default method
     as the smart button does (so the cashier can just change what they
     need and confirm). DO NOT reset the method to cash in the overlay.
  4. Hidden when cart is empty (same rule as the primary button).
  5. Tab order: primary button first, secondary link second. Both
     keyboard-reachable.

FILES          :
  READ (grep tests first per AYA 05 §6):
    - components/pos/pos-workspace.tsx
    - components/pos/view/pos-cart-rail.tsx
    - components/pos/view/pos-checkout-panel.tsx     (source of method labels,
                                                      sale-commit function)
    - components/pos/view/payment-checkout-overlay.tsx
    - components/pos/store/* (wherever POS store lives — grep for `useCart`
      or `usePosStore` to find it)
    - app/globals.css
    - tests/e2e/px06-uat.spec.ts
    - tests/e2e/px22-transactional-ux.spec.ts
    - tests/e2e/device-qa.spec.ts
    - tests/unit/pos-workspace.test.tsx
  EDIT:
    - components/pos/view/pos-cart-rail.tsx   (add smart button + secondary link)
    - components/pos/store/*                  (add lastPaymentMethod persistence)
    - app/globals.css                         (styles for the smart button +
                                               secondary link, flat theme)
  DO NOT EDIT:
    - payment-checkout-overlay.tsx     (overlay remains exactly as is)
    - pos-checkout-panel.tsx internals (reuse its sale-commit function only)
    - API routes
    - cart-review-view.tsx             (mobile path untouched)

IMPLEMENTATION_NOTES :
  - REUSE the existing sale-commit function. Do NOT fork it. If the checkout
    panel currently has logic like `commitSale({ method, amount, customer,
    split, debt, notes, discount })`, call that same function from the smart
    button handler with the minimal payload (method + amount = total, rest
    empty/default). If the function's shape requires fields you can't fill
    safely, STOP and escalate — do not invent defaults.
  - `localStorage` access must be SSR-safe. Wrap reads in `typeof window
    !== "undefined"` checks, or use a `useEffect` to hydrate the default
    after mount. Next.js 15 will crash on direct localStorage reads during
    SSR. Initial render should use the system default; smart method
    hydrates on the client.
  - The secondary link `خيارات دفع أخرى` should pass the current default
    method into the overlay. If the overlay currently receives its initial
    method from props or store state, piggyback on that. Do NOT introduce a
    new prop just for this.
  - Currency formatting: reuse whatever formatter `pos-cart-rail.tsx` uses
    for totals. Do NOT import a new one.
  - Error inline display: add a small error slot ABOVE the smart button in
    the rail footer. When a smart-submit fails, show the error message
    there with role="alert". On next successful click or on manual overlay
    open, clear it.
  - Loading state: disable the primary button and the secondary link
    during flight. Use the same disabled pattern already used elsewhere
    in the rail.

STATE_RULES    :
  - `panelState` values unchanged from Phase 8B.
  - Smart button flow: click → commit sale inline → transition to
    `"success"` panelState (same as current full-overlay flow). The rail
    does NOT open `"payment"` at all for the smart path.
  - Secondary link flow: click → open full payment overlay
    (panelState → `"payment"`) with the current default method pre-selected.
    Exactly the existing overlay flow, just with a smarter default.
  - `lastPaymentMethod` persistence lives in the POS store (or a thin
    wrapper around localStorage inside it). A single source of truth.
  - On sale success (from ANY path), update `lastPaymentMethod` to the
    method actually used. On cancel/error, do NOT update it.
  - Empty cart → smart button + secondary link both hidden; empty-state
    message from 8A remains.

DO_NOT_TOUCH   :
  - Payment overlay component internals or its z-index
  - Checkout panel internals (customer, terminal, split, debt, notes, discount)
  - The sale-commit function's signature or internals — only CALL it
  - Held carts logic / store
  - API routes / data layer / server validation
  - Existing Arabic strings for payment methods — reuse verbatim
  - Any test selector / aria-label / CSS class already referenced in tests/e2e
  - Design tokens (no new colors, no new radii, no new shadows)
  - cart-review-view.tsx (mobile path untouched)
  - Phase 8A/8B rail CSS and container queries (still correct)
  - pos-workspace.tsx panelState machine from 8B (do NOT re-wire it)

TEST_PROTECTION :
  Per AYA 05 §6, BEFORE editing, grep tests/e2e/ AND tests/unit/ for:
    - `.pos-cart-rail`
    - `نقدي` / `بطاقة` / `تحويل` (method labels)
    - `ادفع` / `تأكيد` / `دفع` (payment action strings)
    - `openPaymentOverlay` and any other payment entry handler
    - `lastPaymentMethod` (should return no matches — confirms no collision)
    - `commitSale` or equivalent sale-commit function name
  Read every matching file in full.

  Rules:
  - If an existing test clicks the rail's primary button and expects the
    FULL overlay to open, that test must keep passing. Options:
      (a) make the button label match the test's expected string, OR
      (b) update the test if and only if the new behavior is objectively
          better AND the test's intent is preserved.
    Document your choice in EXECUTION_RESULT.
  - If a test explicitly asserts "overlay opens on every cart pay click",
    STOP and escalate before changing it — that is a design assertion,
    not a locator detail.
  - Do NOT change any payment method label string. Reuse them verbatim.

DONE_IF        :
  ✅ 9A: `lastPaymentMethod` persists across POS reloads via localStorage.
  ✅ 9A: SSR-safe (no hydration mismatch, no `window is not defined` error).
  ✅ 9A: Only the method id is persisted — not amount, customer, or notes.
  ✅ 9A: A fresh install (no localStorage key) falls back to the existing
     system default without crashing.
  ✅ 9B: Rail footer shows a primary `دفع [method label]` button on
     desktop/tablet when the cart is non-empty.
  ✅ 9B: Clicking the smart button with a non-empty cart commits the sale
     in one tap for the simple case (no overlay opens, goes directly to
     success panelState).
  ✅ 9B: Sale failure shows an inline error above the smart button
     (role="alert") and does NOT auto-open the overlay.
  ✅ 9B: Loading state disables the button and prevents double-submit.
  ✅ 9B: `aria-label` includes method + total amount in the same
     currency format as the rest of the rail.
  ✅ 9B: Empty cart → smart button hidden, 8A empty-state preserved.
  ✅ 9B: Mobile (<720px) behavior unchanged — no smart button there.
  ✅ 9C: `خيارات دفع أخرى` secondary link appears under the primary
     button and opens the full existing payment overlay.
  ✅ 9C: Overlay opens with the current default method pre-selected.
  ✅ 9C: Secondary link hidden when cart is empty.
  ✅ 9C: Tab order primary → secondary, both keyboard-reachable.
  ✅ After a successful sale via EITHER path (smart or overlay), the
     `lastPaymentMethod` is updated to the method actually used.
  ✅ After a failed/cancelled sale, `lastPaymentMethod` is NOT updated.
  ✅ No hardcoded left/right (H-11 clean).
  ✅ No changes to payment overlay / checkout panel internals / API.
  ✅ `npx tsc --noEmit --pretty false` → zero output.
  ✅ `npx vitest run` → all pass.
  ✅ `npx playwright test tests/e2e/px22-transactional-ux.spec.ts` → pass.
  ⛔ DO NOT run any other Playwright spec. DO NOT run the full suite.
     Full E2E sweep is deferred to Phase 11.

ESCALATE_IF    :
  - The existing sale-commit function requires fields (e.g., mandatory
    customer, mandatory terminal code) that the smart path cannot safely
    fill with defaults.
  - A test asserts "every pay click opens overlay" as a design contract.
  - The POS store has no clean extension point for `lastPaymentMethod`
    and adding one would require restructuring unrelated state.
  - The payment overlay's initial method is hardcoded and cannot be
    primed from the outside without refactoring the overlay itself.
  - Currency formatting in the rail differs from the one used inside the
    sale-commit call (would mean the aria-label amount and the committed
    amount are computed differently — a real bug risk).
  - px22-transactional-ux regresses in a way that cannot be resolved
    without touching cart logic or overlay internals.

CONTEXT        :
  - Phase 8A (2f3ff16) built the rail. Phase 8B (pending commit) made
    it canonical on desktop. Phase 9 now makes the common cash sale a
    one-tap action via a smart default payment button.
  - AYA 02 → POS flow; smart default is a refinement of the pay action
  - AYA 06 → H-01 (the full overlay is NOT removed — still reachable via
    secondary link), H-02 (payment/cart/debt logic untouched — reuse the
    existing commit function), H-05 (grep tests first)
  - AYA 08 §11 → conflict resolution if tests disagree with AYA
  - Phase 10 (progressive disclosure of advanced options INSIDE the
    overlay) is NEXT after Phase 9. Do NOT pre-implement Phase 10 here.
  - Phase 11 handles AYA documentation updates + full review. Do NOT
    update AYA documents here.

FINAL_REPORT_FORMAT :
  Report ONE consolidated EXECUTION_RESULT covering all three sub-tasks:
    1. Test protection scan (what you grepped, what you found)
    2. Implementation choice per sub-task (9A / 9B / 9C)
    3. Files changed list
    4. Deviations from the spec and why (if any)
    5. Verification results (tsc / vitest / px22-transactional-ux)
    6. Manual browser check notes (desktop + mobile empty-cart sanity)
    7. STATUS: DONE | BLOCKED | PARTIAL
    8. NEXT_STEP: ready for owner review

═══ EXECUTION_RESULT ═══

1. Test protection scan
   - Grepped before edits across `tests/e2e/` and `tests/unit/` for:
     `.pos-cart-rail`, `نقدي|بطاقة|تحويل`, `ادفع|تأكيد|دفع`,
     `openPaymentOverlay`, `lastPaymentMethod`, `commitSale`.
   - Read full matching protection files:
     `tests/e2e/device-qa.spec.ts`,
     `tests/e2e/px06-device-gate.spec.ts`,
     `tests/e2e/px22-transactional-ux.spec.ts`,
     `tests/e2e/px06-uat.spec.ts`,
     `tests/unit/pos-workspace.test.tsx`.
   - Findings:
     no existing `lastPaymentMethod` collision,
     no test asserted “every pay click must open overlay” as a design contract,
     protected desktop/tablet payment-entry tests were still targeting
     `مراجعة الدفع`, so they were updated intentionally to target the new
     secondary entry `خيارات دفع أخرى` while keeping phone on the legacy path.

2. Implementation choice per sub-task
   - 9A:
     extended `stores/pos-cart.ts` instead of creating a new store.
     Added `lastPaymentMethod` state plus SSR-safe read/write helpers for
     `localStorage["aya.pos.lastPaymentMethod"]`.
     Hydration validates the stored method id against current account types,
     clears invalid values, and delays fallback account selection until that
     hydration completes.
   - 9B:
     kept `submitSale` as the single sale-commit path and wired the smart rail
     button through it using a smart snapshot:
     selected method only, exact total, no customer, no split, no notes,
     discounts preserved as-is.
     Added inline smart-submit error slot (`role="alert"`) in the rail footer.
     Added loading/disabled behavior that blocks double submission and suppresses
     payment-overlay opening during smart processing.
   - 9C:
     added secondary `خيارات دفع أخرى` action only in `PosCartRail` inline
     layout.
     It reuses `openPaymentOverlay` directly, clears any inline smart error,
     and inherits the same default method because `selectedAccountId` remains
     the single source of truth for both smart CTA and overlay.

3. Files changed list
   - `stores/pos-cart.ts`
   - `components/pos/pos-workspace.tsx`
   - `components/pos/view/pos-cart-rail.tsx`
   - `app/globals.css`
   - `tests/unit/pos-workspace.test.tsx`
   - `tests/e2e/device-qa.spec.ts`
   - `tests/e2e/px06-device-gate.spec.ts`

4. Deviations from the spec and why
   - No behavioral deviation from 9A/9B/9C.
   - Label output follows existing method chip strings from code truth
     (`كاش`, `بطاقة`, `CliQ`, or account name) instead of inventing new
     synonyms like `نقدي`/`تحويل`; this is required by the brief’s
     “reuse existing method label strings” rule.
   - Existing protected desktop/tablet tests were updated to open the overlay
     through `خيارات دفع أخرى`; this preserves the test intent after the
     rail’s primary CTA became a direct smart-pay action.

5. Verification results
   - `npx tsc --noEmit --pretty false` → passed
   - `npx vitest run` → passed (`71/71` files, `209/209` tests)
   - `npx playwright test tests/e2e/px22-transactional-ux.spec.ts --workers=1`
     → passed (`4/4`)

6. Manual browser check notes
   - No separate full browser sweep was run beyond the task-approved `px22`
     Playwright pass.
   - Sanity confirmed through the inline rail render contract and unit DOM:
     desktop/tablet non-empty cart now exposes primary smart CTA plus secondary
     payment-options link; mobile keeps the legacy `CartReviewView` path and
     does not expose the smart button.
   - Empty-cart behavior remained unchanged: the footer still shows
     `ابدأ بإضافة منتج` instead of any pay CTA.

7. STATUS
   - DONE

8. NEXT_STEP
   - ready for owner review

Commit:
`32e3597` — `feat(pos): add smart default rail payment action`

---

═══ PREVIOUS EXECUTION (Phase 8B — PENDING USER REVIEW, not yet committed) ═══

Phase 8B executed successfully.

Test protection completed before edits:
- Grepped `tests/e2e/`, `tests/unit/`, and `components/pos/pos-workspace.tsx`
  for `cart-review`, `panelState`, cart-entry handlers, and protected cart
  selectors/labels.
- Read full matching files, including:
  `tests/e2e/px22-transactional-ux.spec.ts`,
  `tests/e2e/device-qa.spec.ts`,
  `tests/e2e/px18-visual-accessibility.spec.ts`,
  `tests/e2e/px06-uat.spec.ts`,
  `tests/unit/pos-workspace.test.tsx`,
  plus the live `components/pos/pos-workspace.tsx` wiring.

Implementation choice:
- Chose the small JS state-guard path in `PosWorkspace`, not a new CSS layer.
- Kept Phase 8A container-query rail sizing untouched.
- Reused the existing payment entry handler (`openPaymentOverlay`) so desktop
  still has a single payment entry path.

Files changed:
- `components/pos/pos-workspace.tsx`
- `tests/e2e/px22-transactional-ux.spec.ts`

Implemented:
- Added `products` as the non-overlay browse state in `PosWorkspace`.
- Desktop/tablet no longer return to `cart` when closing payment, hitting
  payment errors, or resetting checkout; they return to `products` with the
  rail as the visible cart surface.
- Mobile still routes through `cart` exactly as before for
  `products → cart → payment`.
- Kept `CartReviewView` mounted on desktop when container queries are active,
  but left it visually hidden there via the Phase 8A CSS handoff.
- Stopped mounting the inline rail on phone viewports so hidden rail markup no
  longer collides with mobile Playwright locators.

Spec alignment:
- `tests/e2e/px22-transactional-ux.spec.ts` still expected the pre-Phase-8A
  empty-cart phone footer button.
- Updated that single phone assertion to the accepted Phase 8A empty-cart
  baseline: `ابدأ بإضافة منتج`.
- No desktop direct-to-payment assertion was weakened or removed.

Verification:
- `npx tsc --noEmit --pretty false` -> passed
- `npx vitest run` -> passed (`71/71` files, `207/207` tests)
- `npx playwright test tests/e2e/px22-transactional-ux.spec.ts --workers=1`
  -> passed (`4/4`)

Result:
- DONE_IF satisfied for Phase 8B.
- Desktop now treats the rail as the canonical cart surface and skips
  cart-review reachability, while mobile keeps the legacy review flow intact.

---

═══ PREVIOUS EXECUTION (Phase 8A — committed 2f3ff16) ═══

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
