# Current Issues and Solutions Summary

## Status: AI Chat Feature Not Fully Functional

The Perplexity AI integration code is complete, but **two critical setup steps are missing** before AI chat can work.

---

## ❌ Issue #1: Missing Database Column

**Error symptoms:**

```
POST https://ogrbtmbmxyqyvwkajdrw.supabase.co/rest/v1/users?id=eq.<id>&select=perplexity_api_key_enc 400 (Bad Request)
```

**Root cause:** The `perplexity_api_key_enc` column doesn't exist in the `users` table yet.

**Solution:** Run database migration

See **[DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)** for complete instructions.

**Quick fix:**

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS perplexity_api_key_enc TEXT;
```

**Current workaround:** App gracefully handles missing column by returning `hasApiKey: false` and showing error message instead of crashing.

---

## ❌ Issue #2: CORS Blocking Browser API Calls

**Error symptoms:**

```
Access to fetch at 'https://api.perplexity.ai/chat/completions' from origin 'http://localhost:5173'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root cause:** Perplexity API cannot be called directly from browser JavaScript due to CORS security policy.

**Solution:** Set up Supabase Edge Function to proxy API calls

See **[PERPLEXITY_SETUP.md](./PERPLEXITY_SETUP.md)** for complete step-by-step guide.

**Why this is required:**

- Browser security prevents frontend JavaScript from calling external APIs
- Need a backend/serverless function to make the actual API call
- Supabase Edge Functions provide a secure, free proxy solution

**Current workaround:** App shows yellow warning message explaining CORS issue and linking to setup docs.

---

## ✅ What's Already Working

The following Perplexity integration tasks are complete:

1. ✅ **Task 1-7:** Core integration code (services, components, UI)
2. ✅ **Task 8:** Chat dialogs pass `userId` correctly
3. ✅ **Task 9:** Encryption key configured in `.env`
4. ✅ **Task 10:** All TypeScript errors fixed
5. ✅ **Error Handling:** Graceful degradation when DB column missing
6. ✅ **CORS Handling:** User-friendly error messages with guidance
7. ✅ **Documentation:** Setup guides created

---

## 🔧 Action Items to Make AI Chat Work

### Priority 1: Database Migration (5 minutes)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/ogrbtmbmxyqyvwkajdrw
2. Go to SQL Editor
3. Run migration from [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)
4. Verify column exists

### Priority 2: Supabase Edge Function (30 minutes)

1. Install Supabase CLI: `brew install supabase/tap/supabase` (Mac) or see docs
2. Login: `supabase login`
3. Link project: `supabase link --project-ref ogrbtmbmxyqyvwkajdrw`
4. Follow complete guide in [PERPLEXITY_SETUP.md](./PERPLEXITY_SETUP.md)
5. Deploy Edge Function
6. Update frontend API endpoint

### Priority 3: Test AI Chat

1. Add your Perplexity API key in Settings page
2. Navigate to a View or Issue
3. Open AI Chat panel
4. Send a test message
5. Verify response appears

---

## 📝 Code Changes Made This Session

### Modified Files:

1. **src/components/view/ViewContextSidebar.tsx**

   - Added `userId` prop to component interface
   - Passes `userId` to `AIChatBox`

2. **src/pages/ViewWorkspace.tsx**

   - Gets current session with `getCurrentSession()`
   - Passes `session.userId` to `ViewContextSidebar`

3. **src/pages/IssueDetail.tsx**

   - Gets current session
   - Passes `userId` to `AIChatBox` in sidebar

4. **src/hooks/useKeyboardShortcuts.ts**

   - Added `"settings"` to `AppContext` type

5. **src/services/ai/aiService.ts**

   - Enhanced error detection for CORS issues
   - Returns helpful error message with setup guidance

6. **src/components/ai/AIChatBox.tsx**

   - Conditional error styling (yellow for warnings, red for errors)
   - Warning icon SVG for CORS errors

7. **src/services/perplexity/userApiKeyService.ts**

   - Removed duplicate code (lines 152-175)
   - Added graceful error handling for missing database columns
   - `getUserApiKeyStatus()` catches error code 42703 (column doesn't exist)
   - `getDecryptedApiKey()` returns `null` on missing column errors

8. **.env** and **.env.example**
   - Added `VITE_ENCRYPTION_KEY` with generated 32-byte hex value

### Created Files:

1. **PERPLEXITY_SETUP.md**

   - Complete guide for Supabase Edge Function setup
   - Includes Edge Function code, deployment steps, frontend changes

2. **DATABASE_MIGRATIONS.md**

   - SQL migration for `perplexity_api_key_enc` column
   - Step-by-step instructions for Supabase Dashboard
   - Verification queries

3. **CURRENT_ISSUES.md** (this file)
   - Comprehensive summary of issues and solutions

---

## 🎯 Expected Behavior After Setup

Once both migrations are complete:

1. **Settings Page:**

   - User can add their Perplexity API key
   - Key is encrypted and saved to database
   - Status shows "API key configured ✓"

2. **View Workspace:**

   - AI Chat panel in right sidebar
   - User can ask questions about the view
   - AI provides context-aware responses

3. **Issue Detail:**

   - AI Chat panel in right sidebar
   - User can ask questions about the issue
   - AI helps with problem-solving

4. **No Errors:**
   - No 400/406 database errors
   - No CORS errors
   - Clean console output

---

## 🐛 Debugging Tips

If issues persist after setup:

### Check Database:

```sql
-- Verify column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'perplexity_api_key_enc';

-- Check if any keys are stored
SELECT id, perplexity_api_key_enc IS NOT NULL as has_key
FROM users
LIMIT 10;
```

### Check Edge Function:

```bash
# View function logs
supabase functions logs perplexity-proxy

# Test function locally
curl -X POST https://ogrbtmbmxyqyvwkajdrw.supabase.co/functions/v1/perplexity-proxy \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"model":"llama-3.1-sonar-small-128k-online"}'
```

### Check Environment:

```bash
# Verify encryption key is set
echo $VITE_ENCRYPTION_KEY

# Verify Perplexity API key is set
echo $VITE_PERPLEXITY_API_KEY
```

---

## 📚 Related Documentation

- [PERPLEXITY_SETUP.md](./PERPLEXITY_SETUP.md) - Edge Function setup
- [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) - Database changes
- `.kiro/specs/perplexity-chat-integration/` - Original requirements

---

**Status:** Ready for database migration and Edge Function deployment
**Last Updated:** Current session
**Developer:** Ready for next steps after you complete these two setup tasks
