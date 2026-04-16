# Vercel ↔ Supabase Sync Guide

## ISSUE SUMMARY
Vercel build fails because async server components (14+ dashboard pages) execute Supabase queries **at build time**, but environment variables are only available **at runtime**. The build container doesn't have access to `SUPABASE_SERVICE_ROLE_KEY`.

---

## EXACT COMMAND TO SYNC PRODUCTION ENVS

```bash
# Step 1: Authenticate with Vercel (one-time only)
npx vercel login

# Step 2: Pull production environment variables
npx vercel env pull --environment=production

# This creates .env.local with all three required variables
```

After running these commands, your `.env.local` will contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## VERIFY ENVIRONMENT PARITY

```bash
# Check what's in your .env.local
cat .env.local

# Expected output (do NOT paste your actual keys here):
# NEXT_PUBLIC_SUPABASE_URL=<URL>
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
# SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

---

## IF npx vercel COMMAND FAILS

**Reason:** You may not have the Vercel CLI installed or not authenticated

```bash
# Install Vercel CLI globally
npm install -g vercel

# Authenticate
vercel login

# Try the pull command again
vercel env pull --environment=production
```

---

## REQUIRED FIX: Add `export const dynamic = "force-dynamic";`

After syncing environment variables, apply this fix to each affected page:

**File:** `app/(dashboard)/home/page.tsx`
```typescript
// ADD THIS LINE at the top (after imports)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوحة المتابعة",
  description: "ملخص يومي للمبيعات والتنبيهات والحركة الأخيرة داخل مساحة العمل."
};

export default async function HomePage() {
  // ... rest of component
}
```

**Why:** Tells Next.js to NOT pre-render this page at build time. Rendering happens only when a user requests it (at runtime), so all environment variables are available.

---

## AFFECTED FILES REQUIRING THE FIX

```
✅ MUST ADD: export const dynamic = "force-dynamic";

app/(dashboard)/home/page.tsx
app/(dashboard)/debts/page.tsx
app/(dashboard)/expenses/page.tsx
app/(dashboard)/inventory/page.tsx
app/(dashboard)/invoices/page.tsx
app/(dashboard)/maintenance/page.tsx
app/(dashboard)/notifications/page.tsx
app/(dashboard)/operations/page.tsx
app/(dashboard)/portability/page.tsx
app/(dashboard)/pos/page.tsx
app/(dashboard)/suppliers/page.tsx
app/(dashboard)/reports/page.tsx
app/(dashboard)/settings/page.tsx
app/(dashboard)/products/page.tsx
```

---

## VERIFICATION CHECKLIST

- [ ] Run `npx vercel env pull --environment=production`
- [ ] Run `npm run build` locally (should complete without errors)
- [ ] Run `npx tsc --noEmit --pretty false` (zero output)
- [ ] Run `npm test` (vitest passes)
- [ ] Add `export const dynamic = "force-dynamic";` to all 14+ affected pages
- [ ] Test pages locally with `npm run dev`
- [ ] Git commit: `git add . && git commit -m "fix(vercel): disable SSG for auth-dependent dashboard pages"`
- [ ] Push to main: `git push origin main`
- [ ] Watch Vercel build logs for completion ✅

---

## IF BUILD STILL FAILS

**Possible cause:** Vercel environment variables not properly saved

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Environment Variables**
3. Verify all three variables are present:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Ensure each is scoped to: **Production, Preview, Development**
5. Click **Save**
6. Trigger a manual redeploy:
   - Go to **Deployments**
   - Click **...** on the latest deployment
   - Select **Redeploy**

---

## SECURITY REMINDERS

✅ `.gitignore` already includes `.env.local` (safe to commit changes)
✅ `NEXT_PUBLIC_*` variables are safe (exposed to browser)
🔒 `SUPABASE_SERVICE_ROLE_KEY` is never exposed to browser (server-only)
🔒 Vercel encrypts environment variables at rest
🔒 Never hardcode secrets in code
