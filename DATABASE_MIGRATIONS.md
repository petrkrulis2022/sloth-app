# Database Migrations Required

This document outlines database schema changes needed for Sloth.app to function properly.

## Missing Column: perplexity_api_key_enc

**Status**: ❌ Not yet applied  
**Required for**: Perplexity AI integration (user API key storage)  
**Priority**: High (AI chat won't work without this)

### Migration SQL

Run this in your Supabase SQL Editor:

```sql
-- Add perplexity_api_key_enc column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS perplexity_api_key_enc TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_perplexity_api_key
ON users(id)
WHERE perplexity_api_key_enc IS NOT NULL;
```

### How to Apply

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ogrbtmbmxyqyvwkajdrw
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Paste the SQL above
5. Click **Run** or press Ctrl+Enter
6. Verify the column was added:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'users'
   AND column_name = 'perplexity_api_key_enc';
   ```

### Verification

After running the migration, the AI chat feature should be able to:

- Save encrypted user API keys to the database
- Retrieve and decrypt API keys when making Perplexity API calls
- Display proper status in settings page

### Current Workaround

The app currently handles missing columns gracefully:

- `getUserApiKeyStatus()` returns `hasApiKey: false` if column doesn't exist
- `getDecryptedApiKey()` returns `null` if column doesn't exist
- AI chat shows user-friendly error message instead of crashing

However, **AI chat will not work** until this migration is applied and a Supabase Edge Function is created.

---

## Related Setup Tasks

After applying this migration, you also need to:

1. **Set up Supabase Edge Function** for Perplexity API proxy

   - See [PERPLEXITY_SETUP.md](./PERPLEXITY_SETUP.md) for complete instructions
   - Required due to CORS restrictions on browser-based API calls

2. **Configure API Keys**
   - User adds their Perplexity API key in Settings page
   - Key is encrypted with AES-256-GCM before storage
   - Encryption key is in `.env` as `VITE_ENCRYPTION_KEY`

---

## Missing Table: view_notes

**Status**: ❌ Not yet applied
**Required for**: The "View Notes" section in the View workspace (between the AI assistant and Issues)
**Priority**: High (View Notes won't load or save without this)

### Migration SQL

Run [add-view-notes-table.sql](./add-view-notes-table.sql) in your Supabase SQL Editor. It creates a `view_notes` table mirroring `project_notes`, scoped to `view_id` instead of `project_id`, with RLS left disabled to match `project_notes` (see [disable-rls-project-notes.sql](./disable-rls-project-notes.sql) — the app uses custom wallet/email auth, not Supabase Auth, so `auth.uid()`-based policies don't apply).

### Verification

```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'view_notes';
```

---

## Future Migrations

As the app evolves, add new migrations here with:

- Migration name and date
- SQL to run
- Verification steps
- Dependencies or prerequisites
