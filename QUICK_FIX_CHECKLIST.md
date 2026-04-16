# ⚡ QUICK FIX CHECKLIST

## The Problem (1 min read)
Your Vercel build fails because dashboard pages try to query Supabase **during the build process**, but the build container doesn't have the `SUPABASE_SERVICE_ROLE_KEY` environment variable. The variable exists in Vercel's runtime, but not in the build phase.

## The Solution (3 steps)

### Step 1: Sync Environment Variables
```bash
npx vercel login
npx vercel env pull --environment=production
```
This downloads your Supabase keys to `.env.local` for local testing.

### Step 2: Disable Pre-Rendering for Protected Pages
Add this single line to the **top** of each of these 14 files:
```typescript
export const dynamic = "force-dynamic";
```

**Files to modify:**
- `app/(dashboard)/home/page.tsx`
- `app/(dashboard)/debts/page.tsx`
- `app/(dashboard)/expenses/page.tsx`
- `app/(dashboard)/inventory/page.tsx`
- `app/(dashboard)/invoices/page.tsx`
- `app/(dashboard)/maintenance/page.tsx`
- `app/(dashboard)/notifications/page.tsx`
- `app/(dashboard)/operations/page.tsx`
- `app/(dashboard)/portability/page.tsx`
- `app/(dashboard)/pos/page.tsx`
- `app/(dashboard)/suppliers/page.tsx`
- `app/(dashboard)/reports/page.tsx`
- `app/(dashboard)/settings/page.tsx`
- `app/(dashboard)/products/page.tsx`

### Step 3: Verify & Deploy
```bash
npm run build        # Should complete without errors
npm run test         # Vitest passes
git add .
git commit -m "fix(vercel): disable SSG for auth-dependent pages"
git push origin main # Vercel auto-deploys
```

---

## Why `export const dynamic = "force-dynamic"` Works

| Timeline | Without Fix | With Fix |
|----------|-------------|----------|
| **Build Time** | Next.js tries to pre-render page → queries Supabase → 🔴 FAILS (no envs) | Skips pre-rendering |
| **Runtime** | N/A | Page renders on-demand → queries Supabase → ✅ SUCCEEDS (envs available) |

---

## If You Get Stuck

**Q: "npx vercel login" doesn't work**
```bash
npm install -g vercel  # Install CLI first
vercel login           # Then login
```

**Q: "npm run build" still fails**
```bash
# Check if all env vars are present
cat .env.local
# Should show all three variables
```

**Q: "npm run build" works locally but Vercel still fails**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all three variables are set and scoped to **Production, Preview, Development**
3. Click **Redeploy** on the latest deployment

---

## Expected Result After Fix

✅ Local: `npm run build` completes in ~60 seconds  
✅ Vercel: Build completes without errors  
✅ Vercel: Pages render correctly at https://your-domain.vercel.app/home  
✅ Dashboard pages load with real data  

---

## Rollback (If Needed)

If anything breaks, revert these changes:
```bash
git revert HEAD
git push origin main
```

---

## Additional Resources

- Full audit report: `VERCEL_INTEGRATION_AUDIT.md`
- Detailed sync guide: `VERCEL_SYNC_GUIDE.md`
- Supabase docs: https://supabase.com/docs
