-- Disable RLS on project_notes table
-- This is needed because the app uses custom authentication (wallet-based)
-- instead of Supabase Auth, so auth.uid() doesn't work

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view project notes for their projects" ON project_notes;
DROP POLICY IF EXISTS "Users can insert project notes for their projects" ON project_notes;
DROP POLICY IF EXISTS "Users can update their own project notes" ON project_notes;
DROP POLICY IF EXISTS "Users can delete their own project notes" ON project_notes;

-- Disable RLS
ALTER TABLE project_notes DISABLE ROW LEVEL SECURITY;
