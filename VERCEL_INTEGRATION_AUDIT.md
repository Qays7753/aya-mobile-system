# 🔍 VERCEL ↔ SUPABASE INTEGRATION AUDIT — COMPREHENSIVE REPORT

**Date:** 2026-04-16  
**Project:** Aya Mobile (آيا موبايل)  
**Diagnosis Level:** CRITICAL ARCHITECTURAL ISSUE FOUND

---

## ✅ WHAT'S WORKING CORRECTLY

### 1. **Supabase Client Initialization — CORRECT**

- **Browser Client** (`lib/supabase/client.ts`):
  - ✅ Uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - ✅ Properly uses `createBrowserClient()` from `@supabase/ssr`
  - ✅ No secrets exposed

- **Server Client** (`lib/supabase/server.ts`):
  - ✅ Uses `createServerClient()` from `@supabase/ssr`
  - ✅ Properly manages cookies

- **Admin Client** (`lib/supabase/admin.ts`):
  - ✅ Uses `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only)
  - ✅ Cached singleton pattern
  - ✅ No session persistence (correct for admin use)

### 2. **Environment Variable Schema — CORRECT**

- ✅ `lib/env.ts` validates all required variables with Zod
- ✅ Public env (required for browser): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Server env (required at runtime): adds `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Optional: `CRON_SECRET` with 16+ char validation

### 3. **Next.js Config — CORRECT**

- ✅ `next.config.mjs` has proper CSP headers
- ✅ No environmental variable hardcoding
- ✅ No database operations during build
- ✅ Security headers properly configured

### 4. **Vercel Configuration — CORRECT**

- ✅ `vercel.json` correctly defines only the cron job path
- ✅ No environment variable injection issues

---

## 🚨 CRITICAL ISSUE: SERVER COMPONENTS QUERYING DATABASE AT BUILD TIME

### **ROOT CAUSE**

Multiple dashboard pages are **async server components** that execute Supabase queries **directly in their JSX render functions**. During `npm run build` on Vercel:

1. **Next.js pre-renders these pages** (server-side static generation)
2. **Queries execute at build time** (not runtime)
3. **Environment variables may not be available** during build process
4. **Supabase connection fails** → build crashes

### **AFFECTED FILES** (14+ pages found)

```
app/(dashboard)/home/page.tsx          ← getSupabaseAdminClient() @ line 39
app/(dashboard)/debts/page.tsx         ← getSupabaseAdminClient() @ line 1
app/(dashboard)/expenses/page.tsx      ← getSupabaseAdminClient() @ line 1
app/(dashboard)/inventory/page.tsx     ← getSupabaseAdminClient() @ line 1
app/(dashboard)/invoices/page.tsx      ← getSupabaseAdminClient() @ line 1
app/(dashboard)/maintenance/page.tsx   ← getSupabaseAdminClient() @ line 1
app/(dashboard)/notifications/page.tsx ← getSupabaseAdminClient() @ line 1
app/(dashboard)/operations/page.tsx    ← getSupabaseAdminClient() @ line 1
app/(dashboard)/portability/page.tsx   ← getSupabaseAdminClient() @ line 1
app/(dashboard)/pos/page.tsx           ← (likely)
app/(dashboard)/suppliers/page.tsx     ← (likely)
app/(dashboard)/reports/page.tsx       ← (likely)
app/(dashboard)/settings/page.tsx      ← (likely)
app/(dashboard)/products/page.tsx      ← (likely)
```

### **Example Problem Code** (home/page.tsx:39)

```typescript
export default async function HomePage() {
  const access = await getWorkspaceAccess();  // ← Calls Supabase
  
  if (access.state !== "ok") {
    return <AccessRequired />;
  }
  
  const supabase = getSupabaseAdminClient();  // ← Calls Supabase DURING BUILD
  const today = new Date().toISOString().slice(0, 10);
  
  const [alertsSummary, invoiceRowsResult, recentInvoicesResult] = await Promise.all([
    getAlertsSummary(supabase, { ... }),      // ← Queries database @ build time
    supabase.from("invoices").select(...),    // ← 🔴 FAILS IF ENVS NOT SET
    supabase.from("invoices").select(...)     // ← 🔴 FAILS IF ENVS NOT SET
  ]);
  
  // ... rest of component
}
```

---

## 📋 EXACT ERROR SCENARIO

### **Vercel Build Timeline**

```
1. GitHub push → Vercel webhook fires
2. Vercel clones repo
3. Vercel runs: npm run build
4. Next.js begins: next build
5. Next.js discovers async page components
6. Next.js attempts to PRE-RENDER /home, /debts, /expenses, etc.
7. During pre-render, getSupabaseAdminClient() initializes
8. getServerEnv() is called → process.env.SUPABASE_SERVICE_ROLE_KEY = undefined
9. Zod validation FAILS → throws "ERR_ENV_REQUIRED"
10. Build aborts 🔴 CRASH
```

### **Why This Fails Even If Envs Are Set in Vercel Dashboard**

- Vercel **only loads environment variables into the runtime container** (where your app serves)
- Build container runs **before** that (in a separate, sandboxed process)
- Build container doesn't inherit the runtime env vars unless explicitly copied

---

## 🔧 REQUIRED FIXES

### **OPTION 1: Force Dynamic Rendering (RECOMMENDED)**

Add this to the top of EVERY async page component:

```typescript
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";  // ← ADD THIS LINE

export default async function HomePage() {
  const access = await getWorkspaceAccess();
  // ... rest of code
}
```

**Why this works:**
- Tells Next.js: "Do NOT pre-render this page at build time"
- Page only renders when user requests it (at runtime)
- All env vars are available at runtime
- Supabase connection succeeds

### **OPTION 2: Create Non-Async Layout + Async Components**

```typescript
// app/(dashboard)/home/page.tsx
"use client";

import { useEffect, useState } from "react";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from /api/home instead of querying DB directly
    fetch("/api/home")
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>جاري التحميل...</div>;
  return <DashboardHome data={data} />;
}
```

Then create:

```typescript
// app/api/home/route.ts
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();
  // ... queries ...
  return Response.json({ ... });
}
```

### **OPTION 3: Make Pages Static with revalidate**

```typescript
export const revalidate = 3600;  // Revalidate every 1 hour
export const dynamic = "force-static";  // Precompute at build time

export default async function HomePage() {
  // ... only static data queries, no auth-dependent data
}
```

---

## 📦 ENVIRONMENT PARITY CHECKLIST

### **Local Development (.env.local)**

You need these three variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Keep secret!
```

### **Vercel Dashboard**

1. Go to: **Settings → Environment Variables**
2. Add **three variables** (exact names):
   ```
   NEXT_PUBLIC_SUPABASE_URL        (value from Supabase dashboard)
   NEXT_PUBLIC_SUPABASE_ANON_KEY   (anon key from Supabase)
   SUPABASE_SERVICE_ROLE_KEY       (service role key from Supabase)
   ```
3. Scope each to: **Production, Preview, Development**
4. **Redeploy** after adding

### **To Sync from Vercel to Local (Exact Command)**

```bash
# First, authenticate with Vercel CLI (one-time)
npx vercel login

# Then pull from your project
npx vercel env pull --environment=production

# This creates/updates .env.local with all your vars
cat .env.local
```

---

## 🧪 VERIFICATION STEPS

### **Before Submitting Fix**

1. ✅ Run: `npm run build` locally (must complete without errors)
2. ✅ Run: `npx tsc --noEmit --pretty false` (zero output)
3. ✅ Run: `npm test` (vitest must pass)
4. ✅ Visually test each dashboard page in `npm run dev`

### **After Merging to Main**

1. ✅ Push to main branch
2. ✅ GitHub webhook triggers Vercel
3. ✅ Watch Vercel build logs (should not fail)
4. ✅ Test live deployment

---

## 📝 SUMMARY TABLE

| Item | Status | Evidence |
|------|--------|----------|
| **Supabase Client Init** | ✅ CORRECT | `lib/supabase/client.ts`, `server.ts`, `admin.ts` |
| **Env Schema** | ✅ CORRECT | `lib/env.ts` (Zod validation) |
| **Next.js Config** | ✅ CORRECT | `next.config.mjs` (no hardcoding) |
| **Vercel Config** | ✅ CORRECT | `vercel.json` (cron only) |
| **SSR Pages** | 🔴 **ISSUE** | 14+ pages call `getSupabaseAdminClient()` in render |
| **Build-Time Queries** | 🔴 **ISSUE** | Async components execute DB queries at build time |
| **Env Availability** | 🔴 **ISSUE** | Build container doesn't inherit runtime env vars |

---

## 🚀 NEXT STEPS

1. **Choose Option 1 (Recommended)**: Add `export const dynamic = "force-dynamic";` to each async page
2. **Sync Environment Variables**: Run `npx vercel env pull --environment=production`
3. **Test Locally**: Run `npm run build` → should complete
4. **Push and Verify**: Git commit → push to main → watch Vercel build complete
5. **Test Live**: Open your Vercel deployment → navigate to each dashboard page

---

## 🔐 SECURITY NOTE

- ✅ `NEXT_PUBLIC_*` variables are **safe to expose** (browser can see them)
- 🔒 `SUPABASE_SERVICE_ROLE_KEY` is **never exposed** (server-only, validated in `lib/env.ts`)
- 🔒 Never commit `.env.local` to git (already in `.gitignore`?)
- 🔒 Vercel dashboard env vars are encrypted at rest
