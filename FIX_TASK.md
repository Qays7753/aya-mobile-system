═══ TASK ZONE — POS FIX (2026-04-16-POS-FIXES) ═════════════════════════

```
TASK_ID        : 2026-04-16-POS-FIXES
TASK_TYPE      : bug-fix (3 issues)
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Three concrete problems reported by user after audit.
                 No state redesign needed — simple fixes.
DEPENDS_ON     : main branch (current state)
```

ISSUES TO FIX:

### ISSUE 1 — Amount Entry Field Missing

PROBLEM:
  User reports: "لا يوجد مكان لادخال المبلغ المستلم"
  (There is no place to enter the amount received)

REQUIREMENT:
  When cashier selects a payment method in the overlay, a numeric input
  field labeled "المبلغ المستلم" (or similar) must appear in the SAME
  overlay for the cashier to enter how much the customer paid.

CURRENT STATE:
  The amount confirmation component exists
  (components/pos/view/payment-amount-confirmation.tsx) but it is NOT
  rendered / NOT visible in the payment overlay.

FIX:
  1. Find where PaymentAmountConfirmation should be rendered in
     components/pos/view/pos-checkout-panel.tsx
  2. Verify it appears when a payment method is selected
  3. Ensure the input is visible and functional
  4. Verify:
     - Input label is correct: "المبلغ المستلم"
     - Remainder displays: "الباقي: X د.أ"
     - Confirm button disabled if amount < total
     - Confirm button enabled if amount >= total
     - Cancel button works (returns to method selection or closes overlay)

VERIFY:
  - `npx tsc --noEmit --pretty false` → zero output
  - `npx vitest run` → all green
  - Manual: Open POS → add product → "خيارات دفع أخرى" → select method
            → numeric input appears with label "المبلغ المستلم"

---

### ISSUE 2 — CliQ Wallets: Only Orange Shown, Not All Available

PROBLEM:
  User reports: "النظام يعرض او سيعرض اكثر من نوع محفظة(كليك) لكن
               الخيار الموجود هو فقطط محفظة اورنج"
  (System will show multiple CliQ wallet types but only Orange is shown)

REQUIREMENT:
  If the database has multiple CliQ wallet accounts (Orange, other providers),
  they should ALL appear in the payment method selection.

CURRENT STATE:
  Unknown. Codex needs to investigate.

FIX:
  1. Check the database: how many CliQ accounts are marked `type = 'cliq'`
     and `is_active = true` and `module_scope = 'core'`?
  2. Check the /api/pos/accounts endpoint: does it return ALL CliQ accounts,
     or is there a filter limiting to Orange only?
  3. If the API is filtering: REMOVE the filter
  4. If the database only has Orange: ASK USER (out of scope for this task)
  5. Verify: `npx tsc` + `npx vitest` pass
  6. Verify: Manual test shows all CliQ wallets if they exist in DB

---

### ISSUE 3 — Product Size in Cart Too Large

PROBLEM:
  User reports: "اريد تصغير حجم المنتجات المعروضة داخل السله"
  "بهدف انها تحتوي على اكبر قدر ممكن من عرض للمنتاجت بدون حاجة
   لعمل سكرول"
  (Products in the cart are too large. Need to shrink them to fit more
   products without requiring scroll, while keeping them readable and
   proportional)

REQUIREMENT:
  Reduce the size of product cards / line items in the cart surface
  proportionally so more products fit without horizontal/vertical scroll.
  They must remain readable and visually consistent.

CURRENT STATE:
  Product cards in the cart are currently large (padding, font sizes, etc).

FIX:
  1. Identify where cart products are rendered:
     - components/pos/view/pos-cart-surface.tsx or similar
     - Look for `.cart-line-card`, `.pos-cart-card`, or similar classes
  2. Reduce sizes proportionally:
     - Padding: reduce by ~20-30% (e.g., from var(--sp-3) to var(--sp-2))
     - Font sizes: reduce by ~10-15% (e.g., from 15px to 13px)
     - Height/width: check min-height/min-width; may need small reduction
     - Gaps between items: reduce slightly
  3. Do NOT break:
     - Hit targets (buttons must remain ≥ 44px)
     - Readability (text must be clear)
     - Icons/indicators (must remain visible)
  4. Test at multiple screen sizes (tablet landscape 1080×810 minimum)
  5. Verify:
     - More products fit without scroll
     - All text is still readable
     - Buttons/interactive elements work
     - Grid/layout is not broken

VERIFY (Issue 3):
  - `npx tsc --noEmit --pretty false` → zero output
  - `npx vitest run` → all green
  - Manual: Open POS → add 5+ products → cart shows many products
            without requiring scroll → all text readable

---

EXECUTION_RESULT FORMAT:

  ISSUE1_FIX:
    - What was the root cause of the missing amount field?
    - How was it fixed?
    - Where is it now rendered?
    - Does it appear correctly in the overlay?

  ISSUE2_FIX:
    - Database CliQ account count: X accounts found
    - API filter status: [filtered / not filtered]
    - Fix applied: [if any]
    - Manual test result: [all CliQ wallets appear / only Orange / other]

  ISSUE3_FIX:
    - CSS changes made: [list the size reductions]
    - Files modified: [which component/CSS files]
    - Before/after comparison: [how many products fit now vs before]
    - Readability check: [text still readable? Yes/No]

  VERIFY:
    - `npx tsc` output: [zero / X errors]
    - `npx vitest` output: [all green / X failures]
    - Manual test results: [all 3 issues resolved? Yes/No]

  FINAL_STATUS:
    - DONE / PARTIAL / BLOCKED
    - One-sentence summary

After writing the EXECUTION_RESULT, reply with exactly:
  "Fixes applied. Amount field, CliQ wallets, and product sizes updated."

EXECUTION_RESULT:

  ISSUE1_FIX:
    - Root cause: `PaymentAmountConfirmation` was already wired in `components/pos/view/pos-checkout-panel.tsx`, but `paymentStep` only reset back to `"method-select"` when `selectedAccountId` became empty. When the selected account arrived after mount or changed from the overlay flow, the panel did not always switch itself into the amount-confirmation step, so the amount input could stay hidden behind the method-selection state.
    - Fix applied:
      - `components/pos/view/pos-checkout-panel.tsx`
        Added `previousSelectedAccountId` tracking and now switch to `"amount-confirmation"` whenever a non-split payment account actually changes.
      - `components/pos/view/payment-amount-confirmation.tsx`
        Updated the visible field label and `aria-label` from `المبلغ المدفوع` / `كم دفع الزبون؟` to `المبلغ المستلم`.
      - Updated selector-dependent tests:
        - `tests/unit/pos-workspace.test.tsx`
        - `tests/e2e/px06-device-gate.spec.ts`
        - `tests/e2e/device-qa.spec.ts`
    - Where it is now rendered: still inside the same payment overlay via `PaymentAmountConfirmation` in `components/pos/view/pos-checkout-panel.tsx`, immediately below the payment-method chips when a method is selected.
    - Overlay result:
      - `المبلغ المستلم` input appears correctly.
      - `الباقي: X د.أ.` remains visible and updates live.
      - `تأكيد الدفع` stays disabled when the amount is below the total and becomes enabled when the amount is enough.
      - Cancel returns the panel back to method selection.

  ISSUE2_FIX:
    - Database CliQ account count: `0` rows, because `cliq` is not a valid `account_type` in this schema. The enum from `supabase/migrations/001_foundation.sql` is:
      - `cash`
      - `visa`
      - `wallet`
      - `bank`
    - Active core wallet count in the live database: `1`
      - `Orange Money` (`type = wallet`, `module_scope = core`, `is_active = true`)
    - API filter status: not filtered to Orange. `app/api/pos/accounts/route.ts` already returns all active `module_scope = 'core'` accounts and does not apply any wallet-provider filter.
    - Fix applied: no code change was needed for `/api/pos/accounts`; the current behavior is data-driven. The overlay shows all active core accounts returned by the API.
    - Manual test result: the payment-method overlay displayed exactly:
      - `الصندوق`
      - `فيزا`
      - `Orange Money`
      Only Orange appears as a wallet because it is the only active core wallet account in the database right now.

  ISSUE3_FIX:
    - CSS changes made in `app/globals.css`:
      - `.pos-cart-card__title`: `18px -> 16px`
      - `.pos-cart-card__summary`: `13px -> 12px`
      - `.pos-cart-card__body`: `gap var(--sp-3) -> var(--sp-2)`
      - `.pos-cart-card__table-head`: tighter gap/padding
      - `.cart-line-list`: `gap var(--sp-2) -> var(--sp-1)`
      - `.cart-line-card`: `padding var(--sp-3) -> var(--sp-2)`
      - `.cart-line-card__header`: `gap var(--sp-3) -> var(--sp-2)`
      - `.cart-line-card__copy strong`: `15px -> 13px`
      - `.cart-line-card__copy p`: `12px -> 11px`
      - `.cart-line-card__line-total`: `18px -> 16px`
      - `.cart-line-card__controls`: `gap var(--sp-3) -> var(--sp-2)`
      - `.cart-line-card__quantity-button`: `48px -> 44px`
      - `.cart-line-card__quantity-value`: `16px -> 14px`
      - `.cart-line-card__discount`: `min-width 132px -> 120px`
      - `.cart-line-card__discount span`: `12px -> 11px`
      - `.cart-line-card__discount input`: `14px -> 13px`, tighter horizontal padding
      - POS runtime settings block updated so the cart stays proportionally denser even inside `.pos-settings-scope`
    - Files modified:
      - `app/globals.css`
    - Before/after comparison:
      - Before: cart rows used `sp-3` padding, `15/18px` primary totals/titles, and `48px` quantity buttons.
      - After: cart rows use `sp-2` padding, `13/16px` primary totals/titles, and `44px` quantity buttons, so each row occupies less vertical space while keeping readable hierarchy.
    - Readability check: Yes. Manual DOM inspection on the live page showed primary cart text around `14.3px` inside the scoped POS surface, and quantity buttons still rendered above the 44px floor (`~47px` effective height with the active density scale).

  VERIFY:
    - `npx tsc` output: zero
    - `npx vitest` output: all green
      - 71 test files passed
      - 209 tests passed
    - Manual test results:
      - Issue 1: Yes, resolved. `المبلغ المستلم` appeared in the same overlay and behaved correctly for underpaid / paid / cancel states.
      - Issue 2: API confirmed correct; live data confirmed only one active core wallet (`Orange Money`), so no hidden provider filter remained to remove.
      - Issue 3: Yes, cart line items render denser and remain readable; hit targets stayed at or above the required minimum.

  FINAL_STATUS:
    - DONE
    - Restored the amount-entry field in the payment overlay, confirmed the wallet list is limited by current database contents rather than an API bug, and reduced cart item sizing proportionally without dropping interaction safety.

═══ END_OF_TASK_SPEC ═══
