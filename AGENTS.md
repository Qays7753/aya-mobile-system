<!--
ملخص عربي سريع:
هذا الملف يحكم Codex. دوره: منفذ فقط.
الجزء الأول ثابت (القواعد والتعليمات) — لا يُمسح أبداً.
الجزء الثاني (TASK ZONE) فيه المهمة الحالية — يُستبدل مع كل مهمة جديدة.
-->

# AGENTS.md — Codex Governance File

> **This file is for Codex only. If you are another Agent, ignore this file.**
> Read this file completely before executing any Task.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | Aya Mobile (آيا موبايل) |
| **Project Type** | Retail POS System (Arabic RTL) |
| **Primary Language** | TypeScript |
| **Framework** | Next.js 15 App Router |
| **Database** | Supabase (Postgres) |
| **Package Manager** | npm |

---

## 2. Your Role

You are an **Executor only** in this system.
Claude is the **Planner** who writes your Tasks in the TASK ZONE below.
Your job: execute what is asked, report the result, then notify the user.

---

## 3. How to Work

```
STEP 1: Read the Task written in the TASK ZONE section below.
STEP 2: Execute the Task following all Rules in Section 4.
STEP 3: Write EXECUTION_RESULT in this same file, below the Task.
STEP 4: In the chat, say ONLY this phrase:
        "Operation [operation-name] complete, ready for review."
        Do NOT explain details in chat — all details go in EXECUTION_RESULT.
```

---

## 4. Rules That Must Never Be Broken

```
RULE-01: Do not change any Public API or Function Signature unless explicitly requested.
RULE-02: Do not delete any file unless explicitly requested.
RULE-03: Do not install any new Package unless explicitly requested.
RULE-04: Do not modify Schema or Database Migration files unless explicitly requested.
RULE-05: Do not touch environment files (.env, .env.local, .env.production, .env.*).
RULE-06: If you discover a problem outside Task scope, report in ISSUES_FOUND only.
RULE-07: Do not replace any existing Library with another unless explicitly requested.
RULE-08: NEVER add a new wrapper, container, or layout layer around existing elements unless
         the Task explicitly specifies the element name, className, and purpose of that wrapper.
         Stacking new divs/sections on top of existing structure causes layout regressions,
         broken tests, and z-index conflicts. If a structural change is needed and not specified,
         STOP and ask in ISSUES_FOUND — do not improvise.
```

---

## 5. Code Standards

### Formatting
- Follow ESLint / Prettier settings in project without exception.
- If none exist: match the style in the file you are editing.

### Naming
| Type | Pattern |
|------|---------|
| Variables / Functions | camelCase |
| Components / Classes | PascalCase |
| Constants | UPPER_SNAKE_CASE |
| Code files (.ts/.js) | kebab-case |
| Component files (.tsx/.jsx) | PascalCase |

### Comments
- Write only if code is not self-explanatory.
- Do not delete existing comments unless your change makes them inaccurate.

---

## 6. Execution Protocol

### Before any change:
1. Read files mentioned in Task using full paths.
2. Understand how code connects to the rest of the project.
3. If Task is ambiguous, assume most conservative interpretation.

### During execution:
1. Minimum number of modifications.
2. Preserve existing behavior except what Task explicitly asks to change.
3. Multiple files → order from Core to Interface.

### After execution:
1. If Tests exist, run them. If fail, fix once only. If fail again, report FAILED.
2. Run `git diff` on every modified file.
3. Write EXECUTION_RESULT in this file below the Task.

---

## 7. Emergency Protocol

```
If you violate any RULE (01-07):
→ STOP immediately. Do not continue.
→ Report the violation in ISSUES_FOUND with exact RULE number.
→ Set STATUS = PARTIAL.
→ Explain in BLOCKED_BY.
```

---

## 8. Infrastructure & Tooling Standing Rules

> These are standing rules for the execution environment. They apply to every Task unless the Task explicitly overrides them.

<!-- VERCEL BEST PRACTICES START -->
### Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->

### Antigravity Terminal Usage Rules (CRITICAL)
- **Do NOT block the main Agent loop**: Whenever you execute a long-running terminal command (e.g., `npm run dev`, `npm start`, watchers), you MUST run it asynchronously in the background so that the agent interaction does not freeze. Use the `WaitMsBeforeAsync` parameter effectively.
- **Avoid Hanging on Prompts**: Anticipate terminal commands that require user input. Bypass them automatically (e.g., using `-y` flags) or run them in the background to prevent the agent from getting stuck waiting indefinitely.

---

## 9. Design System Enforcement Rules (DS-ENFORCE)

> Applied to **every** UI/CSS task. No exceptions. Skipping any rule = automatic PARTIAL status.

### READ ORDER

```
DS-ENFORCE-01: Before any CSS or UI change, read these files in this exact order:
  1. ai-system/DESIGN_SYSTEM.md — tokens, rules, states
  2. New/component-library.html — extract the CSS for the component you're editing
  3. New/RESTRUCTURE_PLAN.md — check if the screen has a restructure plan
  4. ai-system/CSS_BRIDGE.md — find the real class name that maps to the library class
  5. CLAUDE.md File Ownership Map — identify which e2e tests guard your target file
  6. Read EVERY test file listed in the ownership map for your target component
  Skipping any step = automatic PARTIAL status.
```

### TOKEN DISCIPLINE

```
DS-ENFORCE-02: Never write a raw hex color, raw shadow, or raw font-family.
  Every value must reference a token from DESIGN_SYSTEM.md Section 1/11.
  If you need a value that has no token: STOP. Report in ISSUES_FOUND.

DS-ENFORCE-03: When editing a component, replace ALL --aya-* tokens in that
  file with --color-* tokens per the Translation Table (DESIGN_SYSTEM.md §9).
  Never leave mixed token systems in one file.

DS-ENFORCE-04: Before your first token migration task, verify that globals.css
  contains :root definitions for ALL new tokens. If missing: that is your first
  subtask — add them, then proceed.

  WARNING: This is NOT a rename — the color VALUES change completely.
  Old --aya-primary is #4f46e5 (indigo). New --color-accent is #CF694A (copper).
  Old --aya-bg is #f8fafc (cool gray). New --color-bg-base is #F9F8F5 (warm).
  Old --aya-success is #059669. New --color-success is #13773A.
  Old --aya-danger is #dc2626. New --color-danger is #BA1C1C.
  You are applying a full visual redesign, not just swapping variable names.
  Always use the values listed in DS-ENFORCE-06b (from the prototype).
```

### COMPONENT EXTRACTION

```
DS-ENFORCE-05: To extract CSS from component-library.html:
  a. Find the <style> block — all CSS is in one block
  b. Search for the component's class name (e.g., .cart-panel, .stat-card)
  c. Copy ONLY the properties — do NOT copy the class name if the real code
     uses a different name (CSS Module or BEM class)
  d. Map library class → real codebase class using ai-system/CSS_BRIDGE.md
  e. Replace any hardcoded color in the library CSS with the matching token

DS-ENFORCE-06: component-library.html uses shorthand token names (--bg, --border,
  --accent). The real codebase must use full token names (--color-bg-base,
  --color-border, --color-accent). Translate during extraction.

DS-ENFORCE-06b: When token VALUES differ between component-library.html and
  DESIGN_SYSTEM.md, component-library.html wins. The prototype contains
  the latest design decisions and is the single source of truth for both
  VALUES and COMPONENT STRUCTURE.
  DESIGN_SYSTEM.md provides rules, states, z-index, and breakpoints — but
  when a specific color/radius/spacing value conflicts, use the prototype value.
  Authoritative prototype values:
    --color-bg-base:      #F9F8F5  (from prototype --bg)
    --color-bg-surface:   #FFFFFF  (from prototype --card-bg)
    --color-bg-muted:     #F3F1EC  (from prototype --muted-bg)
    --color-border:       #E8E6E1  (from prototype --border)
    --color-text-primary: #181715  (from prototype --text-pri)
    --color-text-secondary: #6D6A62 (from prototype --text-sec)
    --color-accent:       #CF694A  (from prototype --accent)
    --color-accent-hover: #BB5B3E  (from prototype --accent-hover)
    --color-accent-light: #FCF4F1  (from prototype --accent-light)
    --color-success:      #13773A  (from prototype --success)
    --color-success-bg:   #EDF9F1  (from prototype --success-bg)
    --color-danger:       #BA1C1C  (from prototype --danger)
    --color-danger-bg:    #FEF1F1  (from prototype --danger-bg)
    --color-warning:      #B85F0E  (from prototype --warning)
    --color-warning-bg:   #FEFAEB  (from prototype --warning-bg)
```

### RESTRUCTURED SCREENS

```
DS-ENFORCE-07: If the screen you're touching appears in RESTRUCTURE_PLAN.md:
  a. Read the full restructure entry for that screen
  b. Apply the recommended layout pattern (tabs, two-column, accordion, etc.)
  c. Do NOT apply the old layout and then restructure — build the new layout
     directly from the restructure plan
  d. Preserve all existing state/data logic — restructuring is layout only
```

### TEST PROTECTION

```
DS-ENFORCE-08: Before renaming or removing ANY CSS class:
  a. Run: grep -r "className" tests/e2e/
  b. If ANY test file references it: DO NOT RENAME. Style the existing class.
  c. If no test references it: safe to rename, but document in EXECUTION_RESULT.

DS-ENFORCE-09: Before changing ANY visible Arabic string in JSX:
  a. Run: grep -r "النص" tests/e2e/ (replace with the actual Arabic text)
  b. If a test asserts on that string: DO NOT change the string.
  c. If you must change it for design reasons: report in ISSUES_FOUND with
     the test file and line number.

DS-ENFORCE-10: Before changing any aria-label, role, or heading level:
  a. Run: grep -r "aria-label\|getByRole\|getByText" tests/e2e/
     filtered for the specific text or role you're changing
  b. If matched: DO NOT change. Report in ISSUES_FOUND.
```

### RTL CORRECTNESS

```
DS-ENFORCE-11: Never use left/right in CSS properties. Always use:
  - margin-inline-start / margin-inline-end (not margin-left/right)
  - padding-inline-start / padding-inline-end
  - inset-inline-start / inset-inline-end
  - border-inline-start / border-inline-end
  - text-align: start / end (not left/right)
  - float: inline-start / inline-end (not left/right)
  - clear: inline-start / inline-end (not left/right)
  - transform: translateX() — must be negated for RTL if used for directional
    movement. Prefer logical alternatives when possible.

DS-ENFORCE-12: Numbers next to Arabic text must use directional isolation:
  a. Static text:    <bdi dir="ltr">12,500</bdi>
  b. JSX variable:   <bdi dir="ltr">{price}</bdi>
  c. Formatted:      <bdi dir="ltr">{formatCurrency(amount)}</bdi>
  d. Exception: if the number is the ONLY content in an element with
     font-family: var(--font-numeric), no bdi needed — the element
     itself provides isolation.
  Check every price, invoice number, phone, and quantity you touch.
```

### LAYER DISCIPLINE

```
DS-ENFORCE-13: Do NOT add new wrapper divs, containers, or layout layers
  unless the task explicitly names the new element, its className, and purpose.
  (Extension of RULE-08)

DS-ENFORCE-14: When restyling, REMOVE old conflicting styles before adding
  new ones. Search the CSS file for existing rules on the same selector.
  Edit the existing rule — never add a duplicate selector.
```

### CSS MODULES

```
DS-ENFORCE-17: CSS Modules handling:
  a. When the target component uses a .module.css file, write new styles
     THERE — not in globals.css
  b. Class names in CSS modules become camelCase in JSX:
     .cart-panel → styles.cartPanel
  c. Do NOT move styles from a module to globals.css or vice versa
  d. Shared styles used in 3+ components belong in globals.css
  e. Component-specific styles belong in the component's module
```

### RESPONSIVE BREAKPOINTS

```
DS-ENFORCE-18: Use ONLY these breakpoints (from DESIGN_SYSTEM.md §7):
  @media (max-width: 767px)   — mobile
  @media (min-width: 768px)   — tablet and above
  @media (min-width: 1200px)  — desktop
  Do NOT use other breakpoint values. Do NOT use device-specific queries.
  Do NOT use max-width for tablet/desktop — use min-width (mobile-first).
```

### EXECUTION ORDER

```
DS-ENFORCE-15: Execute file changes in this order:
  1. globals.css (tokens, shared utilities, shell styles)
  2. Component CSS modules (from core → leaf)
  3. Component TSX files (only if markup changes are needed)
  4. Page files (only if page-level layout changes are needed)
  After each file: run `npx tsc --noEmit --pretty false`
  After all files: run `npx vitest run`
```

### VERIFICATION BEFORE DONE

```
DS-ENFORCE-16: Before marking STATUS = DONE, verify:
  □ Zero hardcoded hex colors remain in files you edited
  □ Zero --aya-* tokens remain in files you edited
  □ npx tsc --noEmit --pretty false → zero output
  □ npx vitest run → all pass
  □ No CSS class was renamed that is referenced in tests/e2e/
  □ No Arabic string was changed that is asserted in tests/e2e/
  □ All layout uses logical properties (no left/right)
```

---

# ═══════════════════════════════════════════
# ═══ TASK ZONE — Content below is replaced with each new Task ═══
# ═══════════════════════════════════════════
#
# ─────────────────────────────────────────────────────────────────
# HOW THIS TASK ZONE WORKS (read before executing anything)
# ─────────────────────────────────────────────────────────────────
#
# This file contains MULTIPLE migration tasks (004 through 011 + Gemini gates).
# You MUST NOT execute them all at once.
#
# EXECUTION PROTOCOL:
#   1. Execute only the task marked ► CURRENT TASK ◄
#   2. Write EXECUTION_RESULT immediately below that task
#   3. Say "Operation [task-id] complete, ready for review."
#   4. STOP. Do not proceed to the next task.
#   5. Wait for the user to say "انتقل للتالية" (proceed to next)
#   6. Only then move to the next task
#
# Gemini review gates are marked ► GEMINI GATE ◄
# When you reach a gate, say: "Gate [N] reached. Gemini review needed."
# Then stop and wait.
# ─────────────────────────────────────────────────────────────────

# ══════════════════════════════════════════════════════════════
# ► CURRENT TASK ◄  Task 010 — Operations Group
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-07-004b
TASK_TYPE      : refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Gemini review found 12 priority-1 items in Task 004/005 scope
                 still using --aya-* tokens. Quick cleanup pass before 006→009.
DEPENDS_ON     : 2026-04-07-005 (after Gemini review)
```

GOAL :
  Fix 12 remaining --aya-* tokens in globals.css that Gemini flagged in
  Priority 1. These are all within the scope of Tasks 004 and 005 but were
  missed or incomplete in the initial migration.

  THIS IS A CLEANUP PASS — not a full new migration. Just find and replace
  12 specific issues (listed below) and verify zero remaining --aya-* in the
  affected components.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE 12 FIXES (FROM GEMINI REVIEW):

1. **Line 1258–1260 — Global focus-visible**
   Find:     box-shadow: var(--aya-focus-ring);
   Replace:  box-shadow: 0 0 0 3px var(--color-accent-ring);
   (Also replace --aya-focus-shadow if present)

2. **Line 904 — .table-wrap**
   Find:     border-radius: var(--aya-radius-md);
   Replace:  border-radius: var(--radius-md);

3. **Line 943 — .table-empty**
   Find:     color: var(--aya-muted);
   Replace:  color: var(--color-text-secondary);

4. **Line 948 — .list-card**
   Find:     border-radius: var(--aya-radius-md);
   Replace:  border-radius: var(--radius-md);

5. **Line 817 — .chip:hover box-shadow**
   Find:     box-shadow: var(--aya-shadow-sm);
   Replace:  box-shadow: none;  (prototype has no shadow on hover)

6. **Line 784 — .install-button**
   Find:     background: linear-gradient(135deg, var(--aya-accent), var(--aya-accent-deep));
   Replace:  background: linear-gradient(135deg, var(--color-accent), var(--color-text-primary));

7. **Lines 908–940 — Old .data-table (DUPLICATE)**
   This entire block conflicts with the correct version at line 3625+.
   Action:   DELETE the entire old .data-table block at lines 908–940.
   Keep:     The new, correct .data-table at lines 3625+

8. **Lines 1415–1437 — .product-card (old)**
   Find:     border: 1px solid var(--aya-line);
   Replace:  border: 1px solid var(--color-border);
   Find:     box-shadow: var(--aya-shadow-sm);
   Replace:  box-shadow: 0 1px 3px rgba(24,23,21,.04);  (standard shadow)
   Find:     box-shadow: var(--aya-shadow);
   Replace:  box-shadow: 0 8px 20px rgba(207,105,74,.08);  (hover — copper shadow)

9. **Line 1197 — .confirmation-dialog__confirm.is-danger**
   Find:     background: linear-gradient(135deg, #9a2b17 0%, #7b351c 100%);
   Replace:  background: linear-gradient(135deg, var(--color-danger), color-mix(in srgb, var(--color-danger) 80%, #000));

10. **Lines 1334, 1344 — .selection-panel / .selection-chip**
    Find:     border-color: var(--aya-line);
    Replace:  border-color: var(--color-border);

11. **Lines 1391–1392 — .quick-add-card**
    Find:     background: var(--aya-panel);
    Replace:  background: var(--color-bg-surface);
    Find:     border-color: var(--aya-line);
    Replace:  border-color: var(--color-border);

12. **Line 825 — .compatibility-strip**
    Find:     color: var(--aya-muted);
    Replace:  color: var(--color-text-secondary);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPLEMENTATION:

Apply the 12 fixes listed above in order. Each fix is a simple find/replace.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTRAINTS:
  - `app/globals.css` only
  - No TSX, no module.css, no class renames
  - No layout changes
  - This is a CLEANUP pass — not discovering new issues, just fixing known ones

VERIFICATION:
  After all 12 fixes, grep globals.css for:
    grep --aya-focus-ring globals.css    → should be 0
    grep --aya-radius-md globals.css     → should be 0 (except in :root)
    grep --aya-shadow-sm globals.css     → should be 0 (except in :root)
    grep --aya-muted globals.css         → should be ~0 in primitives area
    grep --aya-accent globals.css        → should be 0 (except in :root)

DONE_IF:
  - All 12 fixes applied
  - Zero --aya-* in the 12 specific locations (verified by grep above)
  - tsc clean, vitest results reported
  - Ready to proceed to Task 006

ESCALATE_IF:
  - A line number reference is off (file changed since Gemini review)
  - Unable to locate one of the 12 fixes

═══ EXECUTION_RESULT ═══

  1. PRE_COMMIT    :
                    Not created.
  2. STATUS        :
                    PARTIAL
  3. REPORT        :
                    Completed the `2026-04-07-004b` cleanup pass in `app/globals.css` only.
                    Completed work:
                    - Read the required references in order: `ai-system/DESIGN_SYSTEM.md`, `New/component-library.html`, `New/RESTRUCTURE_PLAN.md`, `ai-system/CSS_BRIDGE.md`, `CLAUDE.md`, and all `app/globals.css` guard files from the ownership map: `tests/e2e/px06-uat.spec.ts`, `tests/e2e/px13-search-alerts.spec.ts`, `tests/e2e/px18-visual-accessibility.spec.ts`, `tests/e2e/px21-shell-auth.spec.ts`, and `tests/e2e/px22-transactional-ux.spec.ts`.
                    - Applied all 12 requested cleanup fixes in `app/globals.css`:
                      1) replaced the global focus-visible ring references,
                      2) changed `.table-wrap` radius to `var(--radius-md)`,
                      3) changed `.table-empty` text color to `var(--color-text-secondary)`,
                      4) changed `.list-card` radius to `var(--radius-md)`,
                      5) removed hover shadow from `.chip:hover`,
                      6) updated `.install-button` gradient to the new token pair,
                      7) deleted the old duplicate `.data-table` block and kept the later canonical block,
                      8) updated the old `.product-card` border and shadow values,
                      9) replaced the danger confirmation gradient with the requested tokenized danger mix,
                      10) updated `.selection-panel` and `.selection-chip` borders to `var(--color-border)`,
                      11) updated `.quick-add-card` surface/border tokens,
                      12) updated `.compatibility-strip` text color.
                    - Did not modify any TSX file, module CSS file, layout structure, or protected class name.
                    Verification:
                    - Manual verification plus `git diff` confirmed the 12 requested edits were applied in the targeted locations.
                    - The duplicate early `.data-table` definition was removed and the canonical `.data-table` block later in the file remains in place.
                    - `npx tsc --noEmit --pretty false` produced zero output.
                    - `npx vitest run` still fails only in the unrelated formatter tests listed below.
  4. ISSUES_FOUND  :
                    `npx vitest run` is not fully green because of existing unrelated failures outside this task's scope:
                    - `tests/unit/formatters.test.ts > formatters > formats currency using the configured locale`
                    - `tests/unit/formatters.test.ts > formatters > formats compact numbers using the configured locale`
                    Both failures still compare Arabic-Indic digit expectations against the current Latin-digit formatter output and were reproduced without touching formatter code.
                    Additional out-of-scope finding:
                    - The task’s broad grep commands are still non-zero because `app/globals.css` contains many other `--aya-*` references outside these 12 cleanup locations (for example around lines 295, 311, 342, 1963, and later catalog ranges). Those leftovers were not part of this cleanup pass and were left untouched per scope.
  5. DIFF_LOG      :
     ```diff
     diff --git a/app/globals.css b/app/globals.css
     @@
     -  background: linear-gradient(135deg, var(--aya-accent), var(--aya-accent-deep));
     +  background: linear-gradient(135deg, var(--color-accent), var(--color-text-primary));
     @@
     -  box-shadow: var(--aya-shadow-sm);
     +  box-shadow: none;
     @@
     -  outline: 2px solid var(--aya-focus-ring);
     -  box-shadow: var(--aya-focus-shadow);
     +  outline: 2px solid transparent;
     +  box-shadow: 0 0 0 3px var(--color-accent-ring);
     @@
     -  border: 1px solid var(--aya-line);
     -  box-shadow: var(--aya-shadow-sm);
     +  border: 1px solid var(--color-border);
     +  box-shadow: 0 1px 3px rgba(24, 23, 21, 0.04);
     @@
     -  background: linear-gradient(135deg, #9a2b17, #7b351c);
     +  background: linear-gradient(135deg, var(--color-danger), color-mix(in srgb, var(--color-danger) 80%, #000));
     ```
  6. BLOCKED_BY    :
                    Full completion is blocked by the unrelated existing `tests/unit/formatters.test.ts` failures above, and by the broader out-of-scope `--aya-*` leftovers that keep the task’s global grep commands non-zero.
  7. FINAL_NOTE    :
                    This cleanup stayed inside `app/globals.css` and only touched the 12 Gemini-flagged items. No class rename, no TSX change, and no layout restructuring was introduced.

# ══════════════════════════════════════════════════════════════
# Task 005 — POS Workspace  (execute only after user approves 004)
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-07-005
TASK_TYPE      : refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : POS is the most complex screen. It uses both globals.css AND
                 CSS Modules (.module.css). Must be one task because module
                 and global rules reference each other visually.
DEPENDS_ON     : 2026-04-07-004 (primitives done — buttons/inputs/chips already migrated)
```

GOAL :
  Migrate POS workspace CSS from --aya-* to --color-* tokens.
  Files in scope: `app/globals.css` (all .pos-*, .transaction-*, .cart-*)
  AND `components/pos/pos-view.module.css`
  AND `components/pos/product-grid-item.module.css`
  AND `components/pos/view/pos-cart-rail.tsx` inline class references (CSS only, not logic).

  Visual target: component-library.html Section 7 (POS Components).
  Cart on RIGHT side (RTL start). 4-column product grid. Sticky 52px pay button.
  Copper accent everywhere. Muted cart background.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO READ:
  1. `New/component-library.html` — Section 7 (POS Components) CSS
  2. `ai-system/CSS_BRIDGE.md` — Section 1 POS rows + Section 2 POS protected selectors
  3. `app/globals.css` — grep for .pos-*, .transaction-*, .cart-*, .pos-layout
  4. `components/pos/pos-view.module.css` — read fully
  5. `components/pos/product-grid-item.module.css` — read fully
  6. Test files: tests/e2e/px06-uat.spec.ts, tests/e2e/px22-transactional-ux.spec.ts,
     tests/e2e/device-qa.spec.ts, tests/e2e/px06-device-gate.spec.ts
  7. `CLAUDE.md` — Protected Entities for pos-workspace.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOKEN SWAP MAP: same as Task 004 (all --aya-* → --color-*)

SPECIFIC RULES TO UPDATE (globals.css POS section):
  .pos-layout: background → var(--color-bg-base)
  .pos-products: background → var(--color-bg-base)
  .pos-product-card: background → var(--color-bg-surface), border → var(--color-border),
                     box-shadow → 0 1px 3px rgba(24,23,21,.04)
  .pos-product-card:hover: border-color → var(--color-accent),
                            box-shadow → 0 8px 20px rgba(207,105,74,.08)
  .pos-product-card__name: color → var(--color-text-primary)
  .pos-product-card__sku / .pos-product-card__stock: color → var(--color-text-secondary)
  .pos-product-card__price: color → var(--color-accent)
  .pos-product-card__add-button: background → var(--color-accent), color → #fff
  .pos-product-card__add-button:hover: background → var(--color-accent-hover)
  .pos-cart-surface: background → var(--color-bg-muted), border → var(--color-border)
  .cart-line-card: background → var(--color-bg-surface), border → var(--color-border)
  .cart-line-card__quantity-button: background → var(--color-bg-muted)
  .cart-line-card__quantity-button:hover: background → var(--color-accent-light),
                                           color → var(--color-accent)
  .pos-cart-summary: background → var(--color-bg-muted)
  .pos-payment-chip: background → var(--color-bg-surface), border → var(--color-border),
                     color → var(--color-text-secondary)
  .pos-payment-chip.is-selected / .pos-payment-chip--active:
    background → var(--color-accent-light), border-color → var(--color-accent),
    color → var(--color-accent)
  .transaction-checkout-button: background → var(--color-accent), color → #fff
  .transaction-checkout-button:hover: background → var(--color-accent-hover)
  .pos-search-field: border → var(--color-border), background → var(--color-bg-surface)
  .pos-search-field input:focus → border-color: var(--color-accent),
                                   box-shadow: 0 0 0 3px var(--color-accent-ring)

CSS MODULES — apply same token swap:
  In pos-view.module.css and product-grid-item.module.css:
  replace every --aya-* reference using the same swap map.
  DS-ENFORCE-17: module files use same --color-* tokens from :root — no new vars.

PROTECTED (do NOT rename — tests depend on these):
  .pos-cart-sheet, .pos-cart-surface, .pos-cart-sheet__summary,
  .transaction-checkout-button, .transaction-product-grid,
  .pos-product-card--compact, .pos-search-field

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTRAINTS:
  - DS-ENFORCE-17: CSS modules use the same --color-* CSS custom properties.
  - No TSX changes. No logic changes. No class renames.
  - DS-ENFORCE-15: tsc + vitest after all changes.

DONE_IF:
  - All POS globals.css + module.css rules use --color-* tokens only
  - Visual matches component-library.html Section 7
  - Protected class names unchanged
  - tsc clean, vitest results reported

ESCALATE_IF:
  - A module.css file defines its own local color variables (not using :root tokens)
  - A test assertion checks a specific background-color computed value

═══ EXECUTION_RESULT ═══

  1. PRE_COMMIT    :
                    Not created.
  2. STATUS        :
                    PARTIAL
  3. REPORT        :
                    Migrated the POS workspace styling from `--aya-*` tokens to the new `--color-*` token system across the allowed POS surfaces without changing any TSX logic, class names, or protected selectors.
                    Completed work:
                    - Read the required references and guards for this UI migration: `ai-system/DESIGN_SYSTEM.md`, `New/component-library.html` Section 7, `New/RESTRUCTURE_PLAN.md`, `ai-system/CSS_BRIDGE.md`, `CLAUDE.md`, and the guarded test files `tests/e2e/px06-uat.spec.ts`, `tests/e2e/px22-transactional-ux.spec.ts`, `tests/e2e/device-qa.spec.ts`, `tests/e2e/px06-device-gate.spec.ts`, `tests/e2e/px18-visual-accessibility.spec.ts`, and `tests/unit/pos-workspace.test.tsx`.
                    - Updated the POS / transaction / cart styling ranges in `app/globals.css` to use the new warm design tokens for product cards, cart surfaces, cart summary, checkout actions, payment chips, mobile cart sheet, status bars, held-cart/customer search surfaces, success states, and related POS support states.
                    - Updated `components/pos/pos-view.module.css` to replace its remaining `--aya-*` references with `--color-*` tokens for the view shell, product pane, search field, panel footer, mobile cart CTA, and mobile gradient overlay.
                    - Updated `components/pos/product-grid-item.module.css` to replace its remaining `--aya-*` references with `--color-*` tokens for in-cart state, quantity controls, text color, and out-of-stock overlay treatment.
                    - Preserved all protected selectors exactly as-is, including `.pos-cart-sheet`, `.pos-cart-surface`, `.pos-cart-sheet__summary`, `.transaction-checkout-button`, `.transaction-product-grid`, `.pos-product-card--compact`, and `.pos-search-field`.
                    - Confirmed no TSX edit was required, so `components/pos/view/pos-cart-rail.tsx` remained unchanged.
                    Verification:
                    - Scoped audit confirmed zero remaining `--aya-*` references in the edited POS ranges of `app/globals.css` and zero remaining `--aya-*` references in `components/pos/pos-view.module.css` and `components/pos/product-grid-item.module.css`.
                    - `npx tsc --noEmit --pretty false` produced zero output after the globals update and after each module update.
                    - `tests/unit/pos-workspace.test.tsx` still passes inside the full suite after the CSS migration.
                    - `npx vitest run` still fails only in the unrelated formatter tests listed below.
  4. ISSUES_FOUND  :
                    `npx vitest run` is not fully green because of existing unrelated failures outside this task's scope:
                    - `tests/unit/formatters.test.ts > formatters > formats currency using the configured locale`
                    - `tests/unit/formatters.test.ts > formatters > formats compact numbers using the configured locale`
                    Reproduced failure detail:
                    - expected Arabic-Indic digit output for `ar-JO`, but the current formatter implementation still returns Latin digits (`12.345` / `1,234`).
  5. DIFF_LOG      :
     ```diff
     diff --git a/app/globals.css b/app/globals.css
     @@
     - .pos-workspace .pos-product-card { border: 1px solid var(--aya-line); background: linear-gradient(...); }
     + .pos-workspace .pos-product-card { border: 1px solid var(--color-border); background: var(--color-bg-surface); box-shadow: 0 1px 3px rgba(24, 23, 21, 0.04); }
     - .pos-workspace .transaction-checkout-button:not(.transaction-checkout-button--secondary) { border: 1px solid var(--aya-success); background: var(--aya-success); }
     + .pos-workspace .transaction-checkout-button:not(.transaction-checkout-button--secondary) { border: 1px solid var(--color-accent); background: var(--color-accent); color: var(--color-bg-surface); }
     - .pos-workspace .pos-cart-surface { background: var(--aya-panel); border: 1px solid var(--aya-line); }
     + .pos-workspace .pos-cart-surface { background: var(--color-bg-muted); border: 1px solid var(--color-border); }

     diff --git a/components/pos/pos-view.module.css b/components/pos/pos-view.module.css
     @@
     - .searchField { border: 1px solid var(--aya-line); background: var(--aya-panel); }
     + .searchField { border: 1px solid var(--color-border); background: var(--color-bg-surface); }
     - .mobileCartButton { border: 1px solid var(--aya-line); background: var(--aya-panel); color: var(--aya-ink); }
     + .mobileCartButton { border: 1px solid var(--color-border); background: var(--color-bg-surface); color: var(--color-text-primary); }

     diff --git a/components/pos/product-grid-item.module.css b/components/pos/product-grid-item.module.css
     @@
     - .quantityButton { background: var(--aya-primary-soft); color: var(--aya-primary); }
     + .quantityButton { background: var(--color-accent-light); color: var(--color-accent); }
     - .outOfStockOverlay { background: rgba(255, 255, 255, 0.64); }
     + .outOfStockOverlay { background: color-mix(in srgb, var(--color-bg-surface) 64%, transparent); }
     ```
  6. BLOCKED_BY    :
                    Full completion is blocked by the unrelated existing `tests/unit/formatters.test.ts` failures above.
  7. FINAL_NOTE    :
                    This task stayed within the allowed POS CSS scope only. No logic changed, no protected selector was renamed, and the POS token migration is ready for the Gemini Gate 1 review step once approved.

# ══════════════════════════════════════════════════════════════
# ► GEMINI GATE 1 ◄  (after tasks 003 + 004 + 005 complete)
# ══════════════════════════════════════════════════════════════
#
# When you (Codex) reach this point, say:
#   "Gate 1 reached. Gemini review needed."
# Then stop. Do not execute Task 006 until the user says "انتقل للتالية".

# ══════════════════════════════════════════════════════════════
# Task 006 — Invoices + Invoice Detail  (after Gate 1 approval)
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-07-006
TASK_TYPE      : refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Invoices list and Invoice Detail are one visual unit —
                 the detail page is reached from the list and shares its
                 card/table/badge patterns. Same task prevents inconsistency.
DEPENDS_ON     : 2026-04-07-005
```

GOAL :
  Migrate `components/dashboard/invoices-workspace.tsx` (CSS classes only,
  no logic) and `components/dashboard/invoice-detail.tsx` CSS classes,
  plus all corresponding rules in `app/globals.css`
  (.invoices-*, .invoice-detail-*, .invoice-*).

  Visual target: component-library.html Section 2 (Data Display) for tables,
  Section 5 (Feedback) for status badges, Section 4 (Buttons) for actions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO READ:
  1. `components/dashboard/invoices-workspace.tsx` — identify all CSS class names used
  2. `components/dashboard/invoice-detail.tsx` — identify all CSS class names used
  3. `app/globals.css` — grep for .invoices-*, .invoice-detail-*, .invoice-*
  4. `ai-system/CSS_BRIDGE.md` Section 2 — protected selectors for invoices
  5. Test files: tests/e2e/px22-transactional-ux.spec.ts, tests/e2e/device-qa.spec.ts

WHAT TO CHANGE (globals.css only):
  Apply the standard token swap map (same as 004/005) to all .invoices-*
  and .invoice-detail-* rules.
  Key targets:
    - Invoice list card surface: background → var(--color-bg-surface), border → var(--color-border)
    - Invoice status badges: use --color-* semantic tokens (done in Task 004 already)
    - Invoice detail tabs/sections: border → var(--color-border)
    - Admin action buttons: already covered by Task 004 button tokens
    - Print CTA: background → var(--color-accent)

  Do NOT change any TSX logic. Only update CSS color values.

PROTECTED class names (do NOT rename):
  .invoices-page__*, .invoice-detail__*, any class referenced in px22 tests

CONSTRAINTS: same as 004/005. tsc + vitest after.

DONE_IF:
  - All .invoices-* / .invoice-detail-* rules use --color-* tokens
  - Status badges match component-library.html color scheme
  - tsc clean, vitest reported

ESCALATE_IF: any --aya-* remains in invoices CSS range

═══ EXECUTION_RESULT ═══

  1. PRE_COMMIT    :
                    Not created.
  2. STATUS        :
                    PARTIAL
  3. REPORT        :
                    Migrated the invoices workspace CSS in `app/globals.css` to the new design-system tokens without changing JSX, logic, class names, or layout structure.
                    Completed work:
                    - Read the required references and guards in order: `ai-system/DESIGN_SYSTEM.md`, `New/component-library.html`, `New/RESTRUCTURE_PLAN.md`, `ai-system/CSS_BRIDGE.md`, `CLAUDE.md`, and the guarded e2e files `tests/e2e/px22-transactional-ux.spec.ts` and `tests/e2e/device-qa.spec.ts`.
                    - Reviewed `components/dashboard/invoices-workspace.tsx` and `components/dashboard/invoice-detail.tsx` to identify the real class usage before touching CSS.
                    - Updated the invoice list row primitives in `app/globals.css` (`.invoice-page__row`, hover state, number/meta/amount styling) from `--aya-*` to `--color-*` tokens.
                    - Switched invoice row surfaces to `var(--color-bg-surface)` / `var(--color-border)`, changed the hover treatment to the warm muted/accent token set, and migrated invoice metadata / amount text to `var(--color-text-secondary)` / `var(--color-text-primary)`.
                    - Replaced the last remaining legacy token in the invoices range by moving `.invoice-page__number` from `var(--aya-font-mono)` to `var(--font-numeric)`, leaving zero `--aya-*` references in the task’s CSS block.
                    - Confirmed there are no dedicated `.invoice-detail-*` rules in `app/globals.css`; the invoice detail page is currently composed from already-migrated shared `transaction-*`, `list-card`, `info-strip`, `status-badge`, and button primitives, so no extra detail-specific CSS edit was required in this task.
                    Verification:
                    - Scoped audit on the invoices CSS block found zero remaining `--aya-*` tokens.
                    - Scoped audit on the invoices CSS block found zero raw hex color values.
                    - `npx tsc --noEmit --pretty false` produced zero output.
                    - `npx vitest run` still fails only in the unrelated formatter tests listed below.
  4. ISSUES_FOUND  :
                    `npx vitest run` is not fully green because of existing unrelated failures outside this task's scope:
                    - `tests/unit/formatters.test.ts > formatters > formats currency using the configured locale`
                    - `tests/unit/formatters.test.ts > formatters > formats compact numbers using the configured locale`
                    Both failures still compare Arabic-Indic digit expectations against the current Latin-digit formatter output and were reproduced without touching formatter code.
  5. DIFF_LOG      :
     ```diff
     diff --git a/app/globals.css b/app/globals.css
     @@
     -  border: 1px solid var(--aya-line);
     -  background: var(--aya-panel);
     +  border: 1px solid var(--color-border);
     +  background: var(--color-bg-surface);
     @@
     -  border-color: color-mix(in srgb, var(--aya-primary) 30%, var(--aya-line));
     -  background: var(--aya-bg-soft);
     +  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-border));
     +  background: var(--color-bg-muted);
     @@
     -  font-family: var(--aya-font-mono);
     -  color: var(--aya-muted);
     -  color: var(--aya-ink);
     +  font-family: var(--font-numeric);
     +  color: var(--color-text-secondary);
     +  color: var(--color-text-primary);
     ```
  6. BLOCKED_BY    :
                    Full completion is blocked by the unrelated existing `tests/unit/formatters.test.ts` failures above; the invoices CSS task itself is complete.

# ══════════════════════════════════════════════════════════════
# Task 007 — Debts + Expenses  (after user approves 006)
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-07-007
TASK_TYPE      : refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Debts and Expenses share the same pattern: search → form → result-card.
                 Migrating together avoids repeating identical token swaps.
DEPENDS_ON     : 2026-04-07-006
```

GOAL :
  Migrate CSS for debts and expenses workspaces in `app/globals.css`
  (.debts-*, .expenses-*, .result-card).

  The .result-card class is test-protected — do NOT rename it.
  Only update its color values.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO READ:
  1. `components/dashboard/debts-workspace.tsx` — class names used
  2. `components/dashboard/expenses-workspace.tsx` — class names used
  3. `app/globals.css` — grep .debts-*, .expenses-*, .result-card
  4. `ai-system/CSS_BRIDGE.md` Section 2 — .result-card is test-protected
  5. Test files: tests/e2e/px22-transactional-ux.spec.ts,
     tests/e2e/device-qa.spec.ts, tests/e2e/px06-device-gate.spec.ts

WHAT TO CHANGE (globals.css only):
  Apply standard token swap to all .debts-* / .expenses-* rules.
  .result-card: background → var(--color-bg-surface), border → var(--color-border),
                keep class name EXACTLY as-is
  Customer search results: border → var(--color-border)
  Payment form inputs: already migrated in Task 004
  Confirm button: already migrated in Task 004

PROTECTED: .result-card, .debts-page__sections (test locators)
CONSTRAINTS: same. tsc + vitest after.
DONE_IF: all .debts-* / .expenses-* / .result-card use --color-* tokens
ESCALATE_IF: any --aya-* remains in debts/expenses CSS range

═══ EXECUTION_RESULT ═══

  1. PRE_COMMIT    :
                    Not created.
  2. STATUS        :
                    PARTIAL
  3. REPORT        :
                    Migrated the debts and expenses CSS surfaces in `app/globals.css` from the legacy token system to the new `--color-*` design-system tokens without changing JSX, logic, class names, or layout structure.
                    Completed work:
                    - Read the required references and guards in order: `ai-system/DESIGN_SYSTEM.md`, `New/component-library.html`, `New/RESTRUCTURE_PLAN.md`, `ai-system/CSS_BRIDGE.md`, `CLAUDE.md`, and the guarded e2e files `tests/e2e/px22-transactional-ux.spec.ts`, `tests/e2e/device-qa.spec.ts`, and `tests/e2e/px06-device-gate.spec.ts`.
                    - Reviewed `components/dashboard/debts-workspace.tsx` and `components/dashboard/expenses-workspace.tsx` to confirm the real class usage before editing CSS.
                    - Updated `.result-card` to the new surface treatment with `var(--color-bg-surface)` and `var(--color-border)` while preserving the protected class name exactly as-is.
                    - Updated debt metadata and debt entry cards (`.debt-customer-card__meta`, `.debt-entry-card__meta`, `.debt-entry-card`) to `--color-*` text/border/surface tokens and removed the old card shadow from the debt entry surface.
                    - Updated expense entry cards (`.expense-entry-card__meta`, `.expense-entry-card`, `.expense-entry-card__title`) to `--color-*` tokens.
                    - Split the expense-specific selectors away from the shared inventory/suppliers selector groups so this task does not prematurely migrate Task 010 surfaces.
                    - Verified that customer search result cards already inherit `var(--color-border)` from the shared `list-card` primitive migrated in Task 004, so no extra selector change was needed there.
                    Verification:
                    - Scoped audit on `.result-card`, the debts block, and the expense-specific selectors found zero remaining `--aya-*` tokens.
                    - Scoped audit on those edited selectors found zero raw hex color values.
                    - `npx tsc --noEmit --pretty false` produced zero output.
                    - `npx vitest run` reproduced only the unrelated formatter failures listed below; the command hit the local timeout after printing the suite summary.
  4. ISSUES_FOUND  :
                    `npx vitest run` is not fully green because of existing unrelated failures outside this task's scope:
                    - `tests/unit/formatters.test.ts > formatters > formats currency using the configured locale`
                    - `tests/unit/formatters.test.ts > formatters > formats compact numbers using the configured locale`
                    Both failures still compare Arabic-Indic digit expectations against the current Latin-digit formatter output and were reproduced without touching formatter code.
  5. DIFF_LOG      :
     ```diff
     diff --git a/app/globals.css b/app/globals.css
     @@
     -  background: linear-gradient(145deg, rgba(63, 107, 82, 0.16), rgba(255, 255, 255, 0.88));
     +  border: 1px solid var(--color-border);
     +  background: var(--color-bg-surface);
     @@
     -  color: var(--aya-muted);
     -  border: 1px solid var(--aya-line);
     -  background: var(--aya-panel);
     +  color: var(--color-text-secondary);
     +  border: 1px solid var(--color-border);
     +  background: var(--color-bg-surface);
     @@
     -  color: var(--aya-ink);
     +  color: var(--color-text-primary);
     ```
  6. BLOCKED_BY    :
                    Full completion is blocked by the unrelated existing `tests/unit/formatters.test.ts` failures above; the debts/expenses CSS task itself is complete.

# ══════════════════════════════════════════════════════════════
# ✅ GEMINI GATE 2 — APPROVED  (Tasks 006 + 007 verified correct)
# ══════════════════════════════════════════════════════════════
#
# Gemini review: PASSED
# All invoices and debts/expenses CSS migrated correctly.
# Zero --aya-* tokens, protected selectors intact, tokens match component-library.html

# ══════════════════════════════════════════════════════════════
# Task 008 — Home + Login  (after Gate 2 approval)
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-07-008
TASK_TYPE      : refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Home uses stat-cards (migrated in 004) and KPI-specific classes.
                 Login has a PERMITTED dark shell exception — must be handled carefully.
DEPENDS_ON     : 2026-04-07-007
```

GOAL :
  Migrate CSS for home dashboard and login page in `app/globals.css`
  (.dashboard-home__*, .lp-*, .landing-*, .baseline-shell--auth, .auth-card, .auth-lamp).

  CRITICAL EXCEPTION (from CLAUDE.md):
  The login shell (.baseline-shell--auth, .auth-card, .auth-lamp, .login-fab)
  is PERMITTED to keep dark atmospheric background and glassmorphism styling.
  Do NOT migrate login shell to light theme. Only migrate text/accent colors
  within the auth card to use --color-* tokens where appropriate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO READ:
  1. `CLAUDE.md` — CSS Exception section (login dark shell is allowed)
  2. `app/globals.css` — grep .dashboard-home__*, .lp-*, .landing-*, .baseline-shell--auth
  3. `components/auth/login-form.tsx` — class names used
  4. Test files: tests/e2e/smoke.spec.ts, tests/e2e/px18-visual-accessibility.spec.ts,
     tests/e2e/px21-shell-auth.spec.ts

WHAT TO CHANGE:
  HOME: Apply standard token swap to all .dashboard-home__* rules.
  KPI cards already partially handled in Task 004 — verify and complete.
  Landing/home sections: swap --aya-* colors.

  LOGIN (careful):
    - Inside .auth-card only: form inputs, labels, error text use --color-* tokens.
    - The .auth-card background, .auth-lamp, .baseline-shell--auth background:
      KEEP as-is (dark exception permitted).
    - The login submit button: background → var(--color-accent) (copper, not indigo).
    - Focus rings inside auth card: 0 0 0 3px var(--color-accent-ring)

PROTECTED: login heading text, submit button label (test assertions in px21)
CONSTRAINTS: same. NEVER apply light theme to .baseline-shell--auth.
DONE_IF: home KPI grid uses --color-*, login form uses --color-* except dark shell
ESCALATE_IF: unsure whether a login rule is inside or outside the dark exception scope

═══ EXECUTION_RESULT ═══

  1. PRE_COMMIT    :
                    Not created.
  2. STATUS        :
                    PARTIAL
  3. REPORT        :
                    Migrated the Home + Login CSS scope in `app/globals.css` to the new `--color-*` token system without changing JSX, class names, or flow logic.
                    Completed work:
                    - Read the required references and guards in order: `ai-system/DESIGN_SYSTEM.md`, `New/component-library.html`, `New/RESTRUCTURE_PLAN.md`, `ai-system/CSS_BRIDGE.md`, `CLAUDE.md`, `components/auth/login-form.tsx`, `components/dashboard/dashboard-home.tsx`, and the guarded e2e files `tests/e2e/smoke.spec.ts`, `tests/e2e/px18-visual-accessibility.spec.ts`, and `tests/e2e/px21-shell-auth.spec.ts`.
                    - Updated the Home-specific selectors in `app/globals.css` for the dashboard KPI band follow-up surfaces that were still pending after Task 004: alert chips, empty copy, invoice list rows, hover state, numeric invoice styling, and invoice metadata now use the warm `--color-*` palette.
                    - Updated the landing / home marketing selectors (`.landing-*`, `.lp-*`) to the new surface, text, accent, success, and warning tokens, replacing the remaining indigo / cyan design values with the current warm copper palette while preserving the existing structure and responsive layout.
                    - Verified that the current login implementation does not actually use `.auth-card`, `.auth-lamp`, or `.baseline-shell--auth` in `app/globals.css`; the active login surface is still the legacy `.form-*`, `.input-*`, and `.btn-submit` contract. I applied the task’s “inside the auth card only” restriction conservatively to those real form controls instead of inventing or renaming selectors.
                    - Migrated the live login form internals to `--color-*` tokens: `.form-container`, headings, labels, input borders/backgrounds, icons, placeholder text, password toggle hover state, remember-email checkbox accent, forgot-password link, submit button, and its `focus-visible` ring now use the new copper/light palette.
                    - Preserved the atmospheric brand shell instead of forcing a light redesign: the dark brand column remained visually dark, while only its raw hex literals were normalized away from the migrated range.
                    Verification:
                    - Scoped audit on the Task 008 selector ranges found zero remaining legacy color-token references (`--aya-primary`, `--aya-panel`, `--aya-line`, `--aya-ink`, `--aya-muted`, `--aya-bg-soft`, `--aya-accent`) in the migrated Home + Login blocks.
                    - Scoped audit on the migrated Task 008 selector ranges found zero raw hex color values.
                    - `npx tsc --noEmit --pretty false` produced zero output.
                    - `npx vitest run` still fails only in the unrelated formatter tests listed below.
  4. ISSUES_FOUND  :
                    `npx vitest run` is not fully green because of existing unrelated failures outside this task's scope:
                    - `tests/unit/formatters.test.ts > formatters > formats currency using the configured locale`
                    - `tests/unit/formatters.test.ts > formatters > formats compact numbers using the configured locale`
                    Both failures still compare Arabic-Indic digit expectations against the current Latin-digit formatter output and were reproduced without touching formatter logic.
  5. DIFF_LOG      :
     ```diff
     diff --git a/app/globals.css b/app/globals.css
     @@
     -  border: 1px solid var(--aya-line);
     -  background: var(--aya-panel);
     +  border: 1px solid var(--color-border);
     +  background: var(--color-bg-surface);
     @@
     -  border-color: var(--aya-primary);
     -  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
     +  border-color: var(--color-accent);
     +  box-shadow: 0 0 0 3px var(--color-accent-ring);
     @@
     -  background-color: var(--aya-primary);
     -  color: #ffffff;
     +  background-color: var(--color-accent);
     +  color: var(--color-bg-surface);
     @@
     -  background: var(--aya-danger-soft);
     -  color: var(--aya-danger);
     +  background: var(--color-danger-bg);
     +  color: var(--color-danger);
     ```
  6. BLOCKED_BY    :
                    Full completion is blocked by the unrelated existing `tests/unit/formatters.test.ts` failures above; the Home + Login CSS task itself is complete.

# ══════════════════════════════════════════════════════════════
# Task 009 — Products + Notifications  (after user approves 008)
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-07-009
TASK_TYPE      : refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Products browser and Notifications both use chip-row + workspace-search
                 + empty-state (all migrated in 004). Only their page-specific
                 classes remain.
DEPENDS_ON     : 2026-04-07-008
```

GOAL :
  Migrate CSS for products browser and notifications in `app/globals.css`
  (.catalog-page__*, .notifications-page__*, .notifications-*).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO READ:
  1. `components/pos/products-browser.tsx` — class names
  2. `components/dashboard/notifications-workspace.tsx` — class names
  3. `app/globals.css` — grep .catalog-*, .notifications-*
  4. `ai-system/CSS_BRIDGE.md` — notifications protected selectors
  5. Test files: tests/e2e/px23-operational-workspaces.spec.ts,
     tests/e2e/px13-search-alerts.spec.ts

WHAT TO CHANGE:
  .catalog-page__*: swap --aya-* tokens
  .notifications-page__sidebar: background → var(--color-bg-surface),
                                  border → var(--color-border)
  .notifications-page__inbox / .notifications-page__alerts:
    background → var(--color-bg-base)
  All alert/inbox item cards: border → var(--color-border)

PROTECTED: .notifications-page__sections (test locator)
CONSTRAINTS: same. tsc + vitest after.
DONE_IF: all catalog + notifications CSS uses --color-* tokens
ESCALATE_IF: any --aya-* remains in catalog/notifications range

═══ EXECUTION_RESULT ═══

  1. PRE_COMMIT    :
                    Not created.
  2. STATUS        :
                    PARTIAL
  3. REPORT        :
                    Migrated the Products + Notifications CSS scope in `app/globals.css` to the new `--color-*` token system without changing JSX, class names, or route structure.
                    Completed work:
                    - Read the required references and guards in order: `ai-system/DESIGN_SYSTEM.md`, `New/component-library.html`, `New/RESTRUCTURE_PLAN.md`, `ai-system/CSS_BRIDGE.md`, `CLAUDE.md`, `components/pos/products-browser.tsx`, `components/dashboard/notifications-workspace.tsx`, and the guarded e2e files `tests/e2e/px23-operational-workspaces.spec.ts` and `tests/e2e/px13-search-alerts.spec.ts`.
                    - Confirmed from `New/RESTRUCTURE_PLAN.md` that Notifications should remain a tabs + progressive-disclosure workspace; kept the current inbox / alerts / search structure intact and limited this task to visual token migration only.
                    - Updated the catalog-specific selectors in `app/globals.css` (`.catalog-quick-add__*`, `.catalog-product-card__*`, `.catalog-page__results-footer`) so the quick-add cards, product cards, metadata copy, price emphasis, stock meta, and action divider all use the new warm surface / border / accent tokens.
                    - Updated the notifications-specific selectors (`.notifications-page__sidebar`, `.notifications-page__inbox`, `.notifications-page__alerts`, `.notifications-alert-chip*`, `.notification-feed-card*`) so the sidebar surface, inbox / alerts background, alert chips, inbox cards, and unread dot all match the current design-system palette and border contract.
                    - Preserved the protected selectors exactly as-is, including `.catalog-page__results` and `.notifications-page__sections`.
                    Verification:
                    - Scoped audit on the catalog selectors found zero remaining `--aya-*` references.
                    - Scoped audit on the notifications selectors found zero remaining `--aya-*` references.
                    - Scoped audit on the migrated Task 009 selector ranges found zero raw hex color values.
                    - `npx tsc --noEmit --pretty false` produced zero output.
                    - `npx vitest run` still fails only in the unrelated formatter tests listed below.
  4. ISSUES_FOUND  :
                    `npx vitest run` is not fully green because of existing unrelated failures outside this task's scope:
                    - `tests/unit/formatters.test.ts > formatters > formats currency using the configured locale`
                    - `tests/unit/formatters.test.ts > formatters > formats compact numbers using the configured locale`
                    Both failures still compare Arabic-Indic digit expectations against the current Latin-digit formatter output and were reproduced without touching formatter logic.
  5. DIFF_LOG      :
     ```diff
     diff --git a/app/globals.css b/app/globals.css
     @@
     -  background: var(--aya-panel);
     -  box-shadow: var(--shadow-sm);
     +  background: var(--color-bg-surface);
     +  box-shadow: 0 1px 3px rgba(24, 23, 21, 0.04);
     @@
     -  color: var(--aya-primary);
     -  color: var(--aya-muted);
     +  color: var(--color-accent);
     +  color: var(--color-text-secondary);
     @@
     -  border: 1px solid var(--aya-line);
     -  background: var(--aya-panel);
     +  border: 1px solid var(--color-border);
     +  background: var(--color-bg-surface);
     @@
     -  border-color: color-mix(in srgb, var(--aya-primary) 28%, var(--aya-line));
     -  background: var(--aya-bg-soft);
     +  border-color: var(--color-accent);
     +  background: var(--color-accent-light);
     ```
  6. BLOCKED_BY    :
                    Full completion is blocked by the unrelated existing `tests/unit/formatters.test.ts` failures above; the Products + Notifications CSS task itself is complete.

# ══════════════════════════════════════════════════════════════
# ✅ GEMINI GATE 3 — APPROVED  (Tasks 008 + 009 verified correct)
# ══════════════════════════════════════════════════════════════
#
# Gemini review: PASSED
# Dashboard home, login (dark shell exception HONORED), products, notifications all correct.
# Zero --aya-* tokens, protected selectors intact, design tokens match component-library.html

# ══════════════════════════════════════════════════════════════
# Task 010 — Operations Group  (after Gate 3 approval)
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-07-010
TASK_TYPE      : refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Inventory, Suppliers, Maintenance, and Operations all share
                 .operational-layout--split + .operational-sidebar +
                 .operational-content pattern. One task for all 4.
DEPENDS_ON     : 2026-04-07-009
```

GOAL :
  Migrate CSS for the four operational workspaces in `app/globals.css`:
  .inventory-page__*, .suppliers-page__*, .maintenance-page__*,
  .operations-page__*, .operational-layout--split, .operational-sidebar,
  .operational-content, .operational-section-nav, .operational-list-card.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO READ:
  1. `components/dashboard/inventory-workspace.tsx` — class names
  2. `components/dashboard/suppliers-workspace.tsx` — class names
  3. `components/dashboard/maintenance-workspace.tsx` — class names
  4. `components/dashboard/operations-workspace.tsx` — class names
  5. `app/globals.css` — grep .inventory-*, .suppliers-*, .maintenance-*,
     .operations-*, .operational-*
  6. Test files: tests/e2e/px23-operational-workspaces.spec.ts,
     tests/e2e/px13-search-alerts.spec.ts

WHAT TO CHANGE:
  Apply standard token swap to all operational workspace CSS.
  .operational-list-card: background → var(--color-bg-surface),
                           border → var(--color-border)
  .operational-list-card--interactive:hover:
    background → var(--color-accent-light), border-color → var(--color-accent)
  .operational-sidebar: background → var(--color-bg-surface),
                         border-inline → var(--color-border)
  .operational-content: background → var(--color-bg-base)

CONSTRAINTS: same. tsc + vitest after.
DONE_IF: all operational workspace CSS uses --color-* tokens
ESCALATE_IF: any --aya-* remains in operational CSS range

═══ EXECUTION_RESULT ═══

  1. PRE_COMMIT    :
                    Not created.
  2. STATUS        :
                    PARTIAL
  3. REPORT        :
                    Migrated the operational workspace CSS scope in `app/globals.css` to the new `--color-*` token system without changing JSX, class names, or workspace flow.
                    Completed work:
                    - Read the required references and guards in order: `ai-system/DESIGN_SYSTEM.md`, `New/component-library.html`, `New/RESTRUCTURE_PLAN.md`, `ai-system/CSS_BRIDGE.md`, `CLAUDE.md`, `components/dashboard/inventory-workspace.tsx`, `components/dashboard/suppliers-workspace.tsx`, `components/dashboard/maintenance-workspace.tsx`, `components/dashboard/operations-workspace.tsx`, and the guarded e2e files `tests/e2e/px23-operational-workspaces.spec.ts` and `tests/e2e/px13-search-alerts.spec.ts`.
                    - Confirmed from `New/RESTRUCTURE_PLAN.md` that inventory, suppliers, maintenance, and operations should keep their existing tab / split-view IA for this wave; limited the work to visual token migration only.
                    - Updated the shared operational selectors in `app/globals.css` (`.operational-page__meta-*`, `.operational-sidebar`, `.operational-content`, `.operational-list-card*`, `.operational-table*`) so the split workspaces, side panels, content panes, list cards, and table states now use the new surface / border / text / accent tokens.
                    - Updated the remaining inventory and suppliers route-specific selectors (`.inventory-count-card__meta`, `.inventory-line-card`, `.inventory-history-card`, `.supplier-directory-card`, `.supplier-directory-card__meta`) to remove the last legacy panel / muted tokens from the Task 010 scope.
                    - Confirmed there are no dedicated `.maintenance-page__*` or `.operations-page__*` selectors in the current `app/globals.css`; those routes now inherit the migrated shared `operational-*` surface rules without any JSX changes.
                    Verification:
                    - Scoped audit on the operational selector ranges found zero remaining `--aya-*` references.
                    - Scoped audit on the migrated Task 010 selector ranges found zero raw hex color values.
                    - `npx tsc --noEmit --pretty false` produced zero output.
                    - `npx vitest run` still fails only in the unrelated formatter tests listed below.
  4. ISSUES_FOUND  :
                    `npx vitest run` is not fully green because of existing unrelated failures outside this task's scope:
                    - `tests/unit/formatters.test.ts > formatters > formats currency using the configured locale`
                    - `tests/unit/formatters.test.ts > formatters > formats compact numbers using the configured locale`
                    Both failures still compare Arabic-Indic digit expectations against the current Latin-digit formatter output and were reproduced without touching formatter code.
  5. DIFF_LOG      :
     ```diff
     diff --git a/app/globals.css b/app/globals.css
     @@
     -  border: 1px solid var(--aya-line);
     -  background: var(--aya-panel-strong);
     +  border: 1px solid var(--color-border);
     +  background: var(--color-bg-surface);
     @@
     -  border-color: color-mix(in srgb, var(--aya-accent) 45%, var(--aya-line-strong) 55%);
     -  box-shadow: var(--aya-shadow);
     +  border-color: var(--color-accent);
     +  background: var(--color-accent-light);
     @@
     -  color: var(--aya-muted);
     -  background: var(--aya-panel);
     +  color: var(--color-text-secondary);
     +  background: var(--color-bg-surface);
     ```
  6. BLOCKED_BY    :
                    Full completion is blocked by the unrelated existing `tests/unit/formatters.test.ts` failures above; the operational workspace CSS task itself is complete.

# ══════════════════════════════════════════════════════════════
# Task 011 — Admin Group: Reports + Settings + Portability
#            (after user approves 010)
# ══════════════════════════════════════════════════════════════

```
TASK_ID        : 2026-04-07-011
TASK_TYPE      : refactor
PROJECT        : Aya Mobile
ROUTED_TO      : Codex
ROUTING_REASON : Reports, Settings, and Portability are admin-only screens sharing
                 .configuration-shell--split + tabs + chart colors.
                 One task for all 3.
DEPENDS_ON     : 2026-04-07-010
```

GOAL :
  Migrate CSS for reports, settings, and portability in `app/globals.css`:
  .reports-page__*, .settings-page__*, .portability-page__*,
  .configuration-shell--split, .configuration-list-shell,
  .configuration-section-nav, .permissions-panel__*.

  Also update chart token references:
  --aya-chart-primary → var(--color-accent)
  --aya-chart-secondary → var(--color-text-secondary)
  --aya-chart-grid → var(--color-border)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT TO READ:
  1. `components/dashboard/reports-overview.tsx` + `reports-advanced-charts.tsx`
  2. `components/dashboard/settings-ops.tsx` + `permissions-panel.tsx`
  3. `components/dashboard/portability-workspace.tsx`
  4. `app/globals.css` — grep .reports-*, .settings-*, .portability-*,
     .configuration-*
  5. Test files: tests/e2e/px11-reports.spec.ts, tests/e2e/px24-analytical-config.spec.ts,
     tests/e2e/px16-navigation-ia.spec.ts

WHAT TO CHANGE:
  Apply standard token swap to all admin workspace CSS.
  .settings-page__panel: background → var(--color-bg-surface),
                           border → var(--color-border)
  .configuration-list-shell: background → var(--color-bg-surface),
                               border-inline → var(--color-border)
  Report filter controls: border → var(--color-border)
  Chart grid lines: --aya-chart-grid → rgba(24,23,21,.06)

PROTECTED: .settings-page__sections (test locator — do NOT rename)
CONSTRAINTS: same. tsc + vitest after.
DONE_IF: all reports/settings/portability CSS uses --color-* tokens
ESCALATE_IF: chart components use inline styles with --aya-* tokens (report it)

═══ EXECUTION_RESULT ═══

  1. PRE_COMMIT    :
                    Not created.
  2. STATUS        :
                    PARTIAL
  3. REPORT        :
                    Migrated the admin workspace CSS scope in `app/globals.css` and updated the report chart token references to the new `--color-*` system without changing route structure, protected selectors, or user-facing copy.
                    Completed work:
                    - Read the required references and guards in order: `ai-system/DESIGN_SYSTEM.md`, `New/component-library.html`, `New/RESTRUCTURE_PLAN.md`, `ai-system/CSS_BRIDGE.md`, `CLAUDE.md`, `components/dashboard/reports-overview.tsx`, `components/dashboard/reports-advanced-charts.tsx`, `components/dashboard/settings-ops.tsx`, `components/dashboard/permissions-panel.tsx`, `components/dashboard/portability-workspace.tsx`, and the guarded e2e files `tests/e2e/px11-reports.spec.ts`, `tests/e2e/px24-analytical-config.spec.ts`, and `tests/e2e/px16-navigation-ia.spec.ts`.
                    - Updated the shared analytical / configuration selectors in `app/globals.css` (`.analytical-page__meta-*`, `.analytical-kpi-card*`, `.configuration-card--danger`, `.configuration-summary-card`, `.configuration-list-shell`, `.configuration-inline-note`) so the reports/settings/portability surfaces now use the warm surface, accent, semantic, and text tokens instead of the old indigo/blue palette.
                    - Updated `.settings-page__panel` and `.settings-page__snapshot-card` to explicit `--color-*` surfaces and borders, preserving the protected `.settings-page__sections` selector exactly as-is.
                    - Verified that the reports filter controls already inherit `var(--color-border)` through the shared `.stack-field` / `.field-input` rules, so no extra filter-only selector was needed.
                    - Updated `components/dashboard/reports-advanced-charts.tsx` to replace the inline `--aya-chart-*` references with `var(--color-accent)`, `var(--color-text-secondary)`, `var(--color-warning)`, and the required `rgba(24, 23, 21, 0.06)` grid line color.
                    - Confirmed there are no dedicated `.portability-page__*` or `.permissions-panel__*` selectors in the current `app/globals.css`; those screens are styled through the migrated shared `.configuration-*` and `.settings-page__*` selectors.
                    Verification:
                    - Scoped audit on the admin selector ranges found zero remaining `--aya-*` references.
                    - Scoped audit on the migrated Task 011 selector ranges found zero raw hex color values.
                    - `components/dashboard/reports-advanced-charts.tsx` now contains zero `--aya-chart-*` references.
                    - `npx tsc --noEmit --pretty false` produced zero output after the CSS changes and again after the chart token update.
                    - `npx vitest run` still fails only in the unrelated formatter tests listed below.
  4. ISSUES_FOUND  :
                    `npx vitest run` is not fully green because of existing unrelated failures outside this task's scope:
                    - `tests/unit/formatters.test.ts > formatters > formats currency using the configured locale`
                    - `tests/unit/formatters.test.ts > formatters > formats compact numbers using the configured locale`
                    Both failures still compare Arabic-Indic digit expectations against the current Latin-digit formatter output and were reproduced without touching formatter code.
  5. DIFF_LOG      :
     ```diff
     diff --git a/app/globals.css b/app/globals.css
     @@
     -  border: 1px solid var(--aya-line);
     -  background: linear-gradient(...);
     +  border: 1px solid var(--color-border);
     +  background: var(--color-bg-surface);
     @@
     -  border-color: rgba(68, 106, 172, 0.18);
     -  background: linear-gradient(...);
     +  border-color: var(--color-accent-ring);
     +  background: var(--color-accent-light);
     diff --git a/components/dashboard/reports-advanced-charts.tsx b/components/dashboard/reports-advanced-charts.tsx
     @@
     -  <CartesianGrid strokeDasharray="3 3" stroke="var(--aya-chart-grid)" />
     -  stroke="var(--aya-chart-primary)"
     +  <CartesianGrid strokeDasharray="3 3" stroke="rgba(24, 23, 21, 0.06)" />
     +  stroke="var(--color-accent)"
     ```
  6. BLOCKED_BY    :
                    Full completion is blocked by the unrelated existing `tests/unit/formatters.test.ts` failures above; the admin workspace migration task itself is complete.

# ══════════════════════════════════════════════════════════════
# ✅ GEMINI GATE 4 — FINAL REVIEW COMPLETE & APPROVED
# ══════════════════════════════════════════════════════════════
#
# Gemini verification: PASSED
# All 11 screens (Tasks 003–011) verified:
# - ZERO --aya-* tokens remaining (grep verified)
# - ZERO --aya-chart-* tokens remaining (grep verified)
# - ZERO hardcoded hex colors in migrated ranges
# - All --color-* tokens correct
# - Protected selectors untouched
# - Architectural decisions applied
# - tsc clean, vitest acceptable
#
# ✅ READY FOR COMMIT
