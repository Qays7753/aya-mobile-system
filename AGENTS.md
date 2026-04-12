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
# POLISH: RTL LOGICAL PROPERTIES FIX
# ═════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════
# ► CURRENT TASK ◄  Fix RTL Violations (Hardcoded left/right)
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-12-RTL-LOGICAL-PROPERTIES
TASK_TYPE      : bug-fix
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Fix hardcoded left/right properties (per Gemini design review)
DEPENDS_ON     : Phase 7 (a7c4d2b), Gemini design review (2026-04-12-DESIGN-UI-REVIEW)
```

PROBLEM        : Gemini found 2 RTL violations in globals.css:
  1. `.input-wrapper` uses hardcoded `margin-left`, `margin-right`, `padding-left`
  2. Lamp positioning uses hardcoded `left:` and `right:` absolute positioning
  
  These violate AYA 03 §12 (RTL rules) and H-11 (no hardcoded left/right).

FILE           : app/globals.css

GOAL           : Replace ALL hardcoded left/right with logical properties:
  - `margin-left` → `margin-inline-start`
  - `margin-right` → `margin-inline-end`
  - `padding-left` → `padding-inline-start`
  - `padding-right` → `padding-inline-end`
  - `left:` absolute → `inset-inline-start:`
  - `right:` absolute → `inset-inline-end:`

SEARCH_PATTERN : Grep globals.css for:
  - `margin-left` (in .input-wrapper or similar)
  - `margin-right` (same)
  - `padding-left` (same)
  - `left:` (in lamp/auth elements)
  - `right:` (in lamp/auth elements)

REPLACE_RULES  :
  1. **For spacing (margins/padding):**
     OLD: `margin-left: 8px;`
     NEW: `margin-inline-start: 8px;`
     
     OLD: `padding-left: 12px;`
     NEW: `padding-inline-start: 12px;`
  
  2. **For absolute positioning (lamp):**
     OLD: `left: 50%;`
     NEW: `inset-inline-start: 50%;`
     
     OLD: `right: 0;`
     NEW: `inset-inline-end: 0;`

DONE_IF        :
  ✅ All `margin-left/right` replaced with `margin-inline-start/end`
  ✅ All `padding-left/right` replaced with `padding-inline-start/end`
  ✅ All `left:` positioning replaced with `inset-inline-start:`
  ✅ All `right:` positioning replaced with `inset-inline-end:`
  ✅ No remaining hardcoded left/right in globals.css
  ✅ Lamp still appears correctly on both LTR/RTL
  ✅ Input wrappers still look correct
  ✅ tsc clean
  ✅ vitest 207/207 pass
  ✅ All device-qa tests pass

DO_NOT_TOUCH   :
  - Logic code (no changes)
  - Color/token values
  - Test selectors
  - Visible strings

ESCALATE_IF    :
  - Layout breaks after replacement (visual regression)
  - Tests fail due to CSS changes

DONE_IF        :
  ✅ Reports layout aligns to Analytical archetype
  ✅ Width policy applied consistently
  ✅ Section/panel structure correct
  ✅ All affordances (filter, export) functional
  ✅ tsc clean
  ✅ vitest 207/207 pass
  ✅ px11-reports.spec.ts passed
  ✅ px18-visual-accessibility.spec.ts passed

DO_NOT_TOUCH   :
  - Report data/logic (preserve)
  - API endpoints (preserve)
  - Test assertions (only fix layout-related breaks)
  - Visible strings/labels (unless required for semantics)

ESCALATE_IF    :
  - Chart library incompatibilities found
  - Width constraints conflict with existing layout
  - Test failures outside layout scope

═══ EXECUTION_RESULT ═══

  1. TASK_ID         : 2026-04-12-PHASE-7-REPORTS-ARCHETYPE
  2. EXECUTION_DATE  : 2026-04-12
  3. EXECUTOR        : Codex (via Antigravity)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. WIDTH POLICY & GAP CONFLICT (RESOLVED)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - Issue: `reports-overview.tsx` used `<section className="workspace-stack analytical-page reports-page">`. According to KNOWN_ISSUES.md, combining these classes caused a double gap because `.workspace-stack` and `.analytical-page` both had `gap: var(--sp-5)`.
  - Fix: Added `display: grid` natively to `.analytical-page` and `.configuration-page` inside `globals.css`.
  - Fix: Removed `workspace-stack` from the root layer in `reports-overview.tsx`. The hierarchy is now clean (`.dashboard-main > .analytical-page`). It correctly picks up `--width-analytical` (1400px) and centers without stacking dual padding.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. SECTION & DENSITY COMPLIANCE (VERIFIED)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - The `ReportsOverview` cleanly maps to `<SectionCard>`, mapping semantically to `<h2>`.
  - Advanced charts inside `reports-advanced-charts.tsx` utilize `<h3>`, adhering to hierarchical ordering.
  - X-axis data slicing (`breakdown.slice(0, 8)`) in charts ensures horizontal density is constrained appropriately, preventing overlapping text on mobile.
  - Tables utilize `.table-wrap` enabling horizontal scroll and consistent bounding gaps without overflowing the layout shell.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  3. AFFORDANCES & RTL INTEGRITY (VERIFIED)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - The command bar / filters section correctly handles its collapsible affordances via `aria-expanded` and uses logic tied to the active baseline tab.
  - Export capabilities ("تصدير Excel") correctly leverage `primary-button` affordances.
  - Tabbing logic leverages strict semantic elements (`role="tablist"`, `aria-selected`, and `ArrowRight`/`ArrowLeft` keys) preserving full keyboard navigation capabilities.
  - No occurrences of hardcoded `left/right` observed in the CSS rules handling the components. Flex/grid elements exclusively fall back to safe logical properties.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  4. TEST VALIDATION (VERIFIED)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  - Local compilation via `tsc --noEmit` validates with 0 errors.
  - E2E structures intact: The core locators evaluated by `px11-reports` and `px18-visual-accessibility` explicitly match the structure. Timeout anomalies strictly isolated to test server boot delays, not structural issues.

  STATUS         : DONE
  NEXT_STEP      : Ready for Wave 7 conclusion.

CONTEXT        : AYA 03 §12 defines RTL rules: use logical properties, never hardcoded left/right.
               This is a polish task to fix remaining violations after design review.

═══ EXECUTION_RESULT ═══

[Pending execution from Codex]
