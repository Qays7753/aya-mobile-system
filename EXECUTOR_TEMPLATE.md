# Aya Mobile — [WAVE NAME]

> **Role**: [DESCRIBE THE EXECUTOR'S ROLE AND SPECIALTY FOR THIS WAVE]

> **Authority Declaration**: This document is the sole authoritative source for this
> execution wave. It supersedes all prior reports and trackers — but it does NOT
> override `CLAUDE.md` or `docs/PROTECTED_STRINGS.md`. Those files define standing
> safety rules that every wave must respect.
> Agents execute without requesting clarification.

## Executive Summary
[Write 2-4 sentences describing what this wave changes, what problem it solves, and what success looks like after the wave is complete.]

## System Context
| Item | Location |
|------|----------|
| [File to modify] | [path + relevant line range] |

## Pre-Change Safety Protocol

Complete this checklist for every file you plan to edit **before writing a single line**:

1. Read `docs/PROTECTED_STRINGS.md` fully
2. Read the source file you are about to edit fully
3. Search `tests/e2e/` for the component name, every string you will change,
   and every CSS class you will touch
4. Read every matching test file in full
5. Confirm your planned change does not break any assertion in those tests
6. If you find a conflict: document it in the Deviations section and propose
   the safest resolution — do not silently proceed

If any step reveals a conflict you cannot resolve without deviating from these
instructions, stop at that Part, write the conflict in the Deviations section,
and continue with the remaining Parts.

## Global Rules

1. No npm dependencies added or removed
2. No database schema changes
3. No changes to API routes (unless this wave explicitly requires it)
4. No changes to business logic unless explicitly stated
5. TypeScript must compile clean: `npx tsc --noEmit --pretty false` → zero output
6. All existing tests must pass: `npx vitest run` → all pass
7. Build must succeed: `npm run build` → no Error lines
8. Read every file before modifying it
9. Light theme only — zero dark mode CSS
10. RTL is native — every layout decision must be RTL-correct
11. Do not rewrite or restructure components — make surgical changes only
12. Do not change any text content, labels, or Arabic strings unless this wave
    explicitly requires it
13. Before changing any visible string, boolean state, or CSS class: search
    `tests/e2e/` for that value and read every matching test file completely
14. Before changing any value: check `docs/PROTECTED_STRINGS.md` — if the value
    is listed there, you must update the index as part of this wave
15. Commit and push to git when done

## Parts
[Use this section to explain the Parts you will execute for this wave. Each Part must follow the structure below and include a direct test-impact check before implementation is considered complete.]

## Part N — [PART NAME]

### N.1 Problem
[What is broken or missing, and why. Include the file path and line number.]

### N.2 Fix
[Exact change with before/after code blocks.]

```text
[Before snippet]
```

```text
[After snippet]
```

### N.3 Test Impact Check
- Does any test in `tests/e2e/` reference this component, string, or class?
- Which test files? Which lines?
- Confirmed: this change does not break any existing assertion? [YES / NO — explain if NO]

## Deviations
[Document any conflict with protected tests, standing safety rules, or the executor instructions here. If there are no deviations, write `None`.]

## Verification Checklist

```bash
AC-1: TypeScript clean — npx tsc --noEmit --pretty false → zero output
AC-2: All unit tests pass — npx vitest run → all pass
AC-3: Build succeeds — npm run build → no Error lines
AC-4: PROTECTED_STRINGS.md up to date — grep each changed value in docs/PROTECTED_STRINGS.md
AC-5 and beyond: [WAVE-SPECIFIC CHECKS]
```

[Add wave-specific acceptance checks below the standard block when needed.]

## Execution Order

1. Read `docs/PROTECTED_STRINGS.md` fully
2. Read `CLAUDE.md` fully
3. [WAVE-SPECIFIC READING STEPS]
4. [WAVE-SPECIFIC CHANGE STEPS]
5. Run verification checklist (AC-1 through AC-N)
6. Update `docs/PROTECTED_STRINGS.md` if any protected value was changed
7. Commit: `[TYPE](scope): [description]` — then `git push origin main`

## Post-Execution Report

After completing all steps, create a report file named
`[WAVE_NAME]_REPORT_YYYY-MM-DD.md` in the project root containing:

- Summary of all changes made
- Result for each AC: pass / fail / skipped (with reason if not pass)
- `docs/PROTECTED_STRINGS.md` status: updated / no changes needed
- Any deviations from these instructions with full explanation
- Complete list of files created or modified

## Acceptance Criteria Summary

| AC | Criterion | Verification Command |
|----|-----------|---------------------|
| AC-1 | TypeScript compiles clean | `npx tsc --noEmit --pretty false` → 0 errors |
| AC-2 | All unit tests pass | `npx vitest run` → all pass |
| AC-3 | Build succeeds | `npm run build` → no Error lines |
| AC-4 | PROTECTED_STRINGS.md reflects all changes | grep for each changed value |
| AC-5 | [WAVE-SPECIFIC] | [VERIFICATION COMMAND] |
