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
- Project phase: Wave 6A complete — Wave 6B next (POS structural fix)
- Last work done: Wave 6A — G4+G2+G1+G3 infrastructure (tokens, layout, surface, SectionCard)
- Current priority: Wave 6B (P3→P1→P2→P4: CSS cleanup, sticky fix, toolbar, max-width POS)
- Quality gates: build ✅ | tsc ✅ | vitest 207/207 ✅ | e2e 55+1flaky ✅
- Flaky test: px06-device-gate.spec.ts:159 (.pos-cart-sheet timing) — non-blocking, passes on retry
- Known issues logged: ai-system/KNOWN_ISSUES.md (Wave 6B/C remaining)
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
| 2026-04-10-WAVE-5 | Loading Screen + A11y + Regression hardening | Codex | DONE | 56 e2e passed, tsc clean, build ok |
| 2026-04-10-WAVE-6A | Token cleanup + max-width + surface + SectionCard | Codex | DONE | 207/207 vitest, 55 passed + 1 flaky e2e |

---

## OPEN_ISSUES

| # | Problem | Affected file | Priority |
|---|---------|--------------|----------|
| 1 | 2 formatter tests fail (Arabic-Indic vs Latin digits) — pre-existing | tests/unit/formatters.test.ts | low |
| 2 | Recharts width(-1)/height(-1) warnings in Playwright logs — non-blocking | components/dashboard/reports-overview.tsx | low |
| 3–13 | UI/structural issues (G1–G5, P1–P6, R1–R2) — documented in full | ai-system/KNOWN_ISSUES.md | Wave 6 |

---

## NEXT_TASKS

- [x] Wave 5 — DONE
- [x] Wave 6A — DONE
- [ ] Wave 6B — P3 (CSS cleanup) → P1 (sticky) → P2 (toolbar) → P4 (max-width POS)
- [ ] Wave 6C — P5, R1, P6, R2, G5 (polish)

---

## META
```
Last updated           : 2026-04-10
Last TASK_ID           : 2026-04-10-WAVE-6A
Last Agent             : Codex
Total Tasks so far     : 13
Current line count     : ~80 / 150
```
