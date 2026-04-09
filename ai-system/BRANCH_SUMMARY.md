<!--
ملخص عربي سريع:
دماغ النظام — يُقرأ مرة وحدة أول كل جلسة.
فيه: حالة المشروع، آخر 5 قرارات، مشاكل مفتوحة، مهام مقترحة.
حد أقصى: 150 سطر.
-->

# BRANCH_SUMMARY.md — System Memory

> Read ONCE at session start. Max 150 lines.

---

## CURRENT_STATE

```
- Project phase: UI Restructuring — Phase 2 complete (Waves 1–4 done)
- Last work done: Wave 4 — Notifications/Debts/Invoices/POS/Products + hardening for px23
- Current priority: Wave 5 (Loading Screen + A11y final pass + Regression hardening)
- Known issues logged: ai-system/KNOWN_ISSUES.md (13 issues, Wave 6 scope)
- Design system expanded: DESIGN_SYSTEM.md §12–15 added (Surface Hierarchy, Layout, SectionCard, CSS Scoping)
```

---

## LAST_5_DECISIONS

| TASK_ID | Operation | Agent | STATUS | Note |
|---------|-----------|-------|--------|------|
| 2026-04-06-TOKEN-MIGRATION | Migrate all --aya-* tokens → --color-* in globals.css | Codex | DONE | Full token migration complete |
| 2026-04-06-SHELL-REFACTOR | Replace sidebar with Mega Popover nav | Codex | DONE | Sidebar removed, popover implemented |
| 2026-04-09-WAVE-2A-2B | Settings + Reports + Suppliers + Portability restructure | Codex | DONE | Two-column splits, tab patterns, ARIA roles |
| 2026-04-09-WAVE-3-4 | Inventory/Maintenance/Notifications/Debts/Invoices/POS | Codex | DONE | 12 passed e2e (px13, px22, px23) |
| 2026-04-09-AUTH-PERF | Login role-check timeout (2s Promise.race) | Claude | DONE | Fixes slow login; 5/5 login tests pass |

---

## OPEN_ISSUES

| # | Problem | Affected file | Priority |
|---|---------|--------------|----------|
| 1 | 2 formatter tests fail (Arabic-Indic vs Latin digits) — pre-existing | tests/unit/formatters.test.ts | low |
| 2 | Recharts width(-1)/height(-1) warnings in Playwright logs — non-blocking | components/dashboard/reports-overview.tsx | low |
| 3–13 | UI/structural issues (G1–G5, P1–P6, R1–R2) — documented in full | ai-system/KNOWN_ISSUES.md | Wave 6 |

---

## NEXT_TASKS

- [ ] Wave 5 — Task 5.1: Dashboard Loading Screen skeleton update
- [ ] Wave 5 — Task 5.2: Accessibility final pass (WCAG AA audit)
- [ ] Wave 5 — Task 5.3: Regression hardening (full test suite)
- [ ] Wave 6 (future) — Fix 13 known UI issues from KNOWN_ISSUES.md

---

## META
```
Last updated           : 2026-04-09
Last TASK_ID           : 2026-04-09-WAVE-4
Last Agent             : Codex
Total Tasks so far     : 11
Current line count     : ~70 / 150
```
