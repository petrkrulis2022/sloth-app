-- Create view_notes table
-- This table stores notes for views, mirroring project_notes but scoped to a view
-- Safe to run on existing data
--
-- RLS is left disabled to match project_notes: the app uses custom
-- wallet/email authentication instead of Supabase Auth, so auth.uid()
-- based policies don't apply (see disable-rls-project-notes.sql).

CREATE TABLE IF NOT EXISTS view_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id UUID NOT NULL REFERENCES views(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_view_notes_view_id ON view_notes(view_id);
CREATE INDEX IF NOT EXISTS idx_view_notes_created_by ON view_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_view_notes_created_at ON view_notes(created_at);
