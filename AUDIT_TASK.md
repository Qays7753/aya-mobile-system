═══ TASK ZONE — AUDIT TASK (2026-04-15-POS-IMPLEMENTATION-AUDIT) ═════════

```
TASK_ID        : 2026-04-15-POS-IMPLEMENTATION-AUDIT
TASK_TYPE      : code-audit (gap analysis)
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : User reports that the implemented code does NOT match
                 the requirements. This task is to read the ACTUAL
                 implementation from the last 3 commits and report
                 what is MISSING, BROKEN, or WRONG.
DEPENDS_ON     : main branch (commits bd0787a, 1ebcee1, f9cb036, f06a86e)
```

CONTEXT:
  User reports:
    1. "في مكان لادخال المبلغ" (There is NO place to enter amount)
    2. "لا بعدها مثل ما سبق، لكن اضا طلب ان تكون كل خيارت الدفع ظاهرة مباشرة"
       (Payment options should appear directly in the POS surface, like
       the smart cash button, not hidden in an overlay)
    3. "إلغاء" button is missing
    4. Debts option / flow is missing
    5. Settings modal looks broken / unresponsive

  The user wants a FULL GAP ANALYSIS:
    - What was REQUIRED (from the task spec)
    - What was IMPLEMENTED (in the code)
    - What is MISSING or BROKEN
    - Why it happened

GOAL:
  Do NOT fix anything. Just READ the code and REPORT the gaps.

PRE-FLIGHT (AUDIT):
  1. Read the 3 commit diffs completely:
       - 1ebcee1 (fix(pos): show real account names)
       - f9cb036 (feat(pos): require explicit amount confirmation)
       - f06a86e (refactor(pos): unify display settings under slider)

  2. Read these files in their CURRENT state:
       - components/pos/view/payment-checkout-overlay.tsx
       - components/pos/view/pos-checkout-panel.tsx
       - components/pos/view/payment-amount-confirmation.tsx (if exists)
       - components/pos/pos-workspace.tsx (focus on payment flow)
       - stores/pos-settings.ts
       - hooks/use-pos-settings.ts
       - components/pos/pos-settings-modal.tsx

AUDIT CHECKLIST — Payment Flow (Step 2.5 Requirements vs Reality):

  REQUIREMENT 1: Amount Entry Field
    ❓ REQUIRED: Numeric input field labeled "كم دفع المزبون؟" appears
       AFTER cashier selects payment method
    ❓ ACTUAL: [Read the code and answer]
       - Is there an amount input field in the overlay? Yes / No
       - Where is it rendered? (in overlay / separate component / missing)
       - Is it visible to the user? Yes / No
       - Is it mandatory before completing sale? Yes / No

  REQUIREMENT 2: Payment Method Selection in Same Overlay
    ❓ REQUIRED: All payment methods (cash, bank, cliq) appear in the
       SAME overlay, not hidden behind state switching
    ❓ ACTUAL: [Read the code and answer]
       - Does pos-checkout-panel show all payment methods initially? Yes / No
       - Are payment methods in a separate screen/state? Yes / No
       - After selecting a method, does the overlay stay open? Yes / No

  REQUIREMENT 3: Remainder/Change Display
    ❓ REQUIRED: Live display showing "الباقي: X د.أ" updates as
       cashier types amount
    ❓ ACTUAL: [Read the code and answer]
       - Is there a remainder calculation? Yes / No
       - Is it displayed to the user? Yes / No
       - Does it update live? Yes / No

  REQUIREMENT 4: Confirm Button States
    ❓ REQUIRED: "تأكيد" button is:
       - DISABLED if amount_paid < total_amount
       - Shows error: "يجب الدفع كامل المبلغ"
       - ENABLED if amount_paid >= total_amount
    ❓ ACTUAL: [Read the code and answer]
       - Is confirm button present? Yes / No
       - Does it have disabled state logic? Yes / No
       - What triggers the disabled state?
       - Is error message shown? Yes / No

  REQUIREMENT 5: Cancel Button
    ❓ REQUIRED: "إلغاء" button returns user to:
       - Method selection (to choose different payment method), OR
       - Closes the overlay entirely
    ❓ ACTUAL: [Read the code and answer]
       - Is there a cancel button in the amount confirmation? Yes / No
       - What does it do when clicked?
       - Does it return to method selection? Yes / No

  REQUIREMENT 6: No Debt in POS
    ❓ REQUIRED: If amount < total, payment is BLOCKED entirely.
       Cashier cannot proceed. Must use separate Debts module.
    ❓ ACTUAL: [Read the code and answer]
       - Is underpayment blocked? Yes / No
       - Is there a "go to debts" option? Yes / No
       - What happens if cashier enters less than total?

  REQUIREMENT 7: Payment Methods Visible Directly (Like Smart Cash)
    ❓ REQUIRED: User said "كل خيارت الدفع ظاهرة مباشرة مثل الدفع كاش"
       Payment options should be visible directly in the POS surface,
       similar to how the smart cash rail button is always visible
    ❓ ACTUAL: [Read the code and answer]
       - Are payment method chips/buttons visible in the overlay? Yes / No
       - Are they in a separate screen behind state? Yes / No
       - Does user have to click to reveal them? Yes / No

AUDIT CHECKLIST — Settings Modal (Step 3 Requirements vs Reality):

  REQUIREMENT 1: Slider Display
    ❓ REQUIRED: Range input slider 1..100, step 5, with live readout
    ❓ ACTUAL: [Read the code and answer]
       - Is slider rendered? Yes / No
       - Does it appear correctly? Yes / No
       - Is there a readout (live number display)? Yes / No

  REQUIREMENT 2: Preset Buttons
    ❓ REQUIRED: Three buttons: "صغير" (25), "طبيعي" (50), "كبير" (75)
    ❓ ACTUAL: [Read the code and answer]
       - Are preset buttons present? Yes / No
       - Do they have the correct labels? Yes / No
       - Do they set the correct values? Yes / No

  REQUIREMENT 3: Contrast Control (Separate)
    ❓ REQUIRED: Three radio options: "افتراضي" / "ناعم" / "قوي"
       UNCHANGED from before
    ❓ ACTUAL: [Read the code and answer]
       - Are contrast options present? Yes / No
       - Are they separate from the slider? Yes / No
       - Do they still work? Yes / No

  REQUIREMENT 4: CSS Scale Variables Applied
    ❓ REQUIRED: Four scale variables applied to the modal:
       --pos-font-scale, --pos-density-scale, --pos-icon-scale,
       --pos-radius-scale
    ❓ ACTUAL: [Read the code and answer]
       - Are the variables defined in stores/pos-settings.ts? Yes / No
       - Are they computed in pos-workspace.tsx? Yes / No
       - Are they applied to section.pos-workspace? Yes / No
       - Is the modal styled with these variables? Yes / No

  REQUIREMENT 5: Modal Appearance / Responsiveness
    ❓ REQUIRED: Modal appears clean, responsive, with proper styling
    ❓ ACTUAL: [Read the code and answer]
       - Does modal render without errors? Yes / No
       - Are CSS classes applied correctly? Yes / No
       - Is it visually broken/unresponsive? Yes / No
       - What specifically looks wrong?

EXECUTION_RESULT FORMAT:

Write a report with these sections:

  PAYMENT_FLOW_AUDIT:
    For each REQUIREMENT 1-7 above:
      - REQUIREMENT: [quote the requirement]
      - ACTUAL CODE: [what you found in the code]
      - GAP: [Yes / No — is there a gap?]
      - DETAILS: [what specifically is missing or broken]

  SETTINGS_MODAL_AUDIT:
    For each REQUIREMENT 1-5 above:
      - REQUIREMENT: [quote the requirement]
      - ACTUAL CODE: [what you found]
      - GAP: [Yes / No]
      - DETAILS: [what specifically is wrong]

  SUMMARY:
    - Total gaps found: X
    - Payment flow broken? Yes / No
    - Settings modal broken? Yes / No
    - Root cause: [Why do you think these gaps exist?]
    - Is the code salvageable, or does it need a full rewrite?

  RECOMMENDATIONS:
    - Option A: [Fix the gaps incrementally]
    - Option B: [Revert problematic commits and start fresh]
    - Which is better and why?

After writing the EXECUTION_RESULT, reply with exactly:
  "Audit complete. Payment flow and settings modal gaps identified."

═══ END_OF_TASK_SPEC ═══
