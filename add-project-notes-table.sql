-- Create project_notes table
-- This table stores notes for projects, similar to comments but at project level
-- Safe to run on existing data

CREATE TABLE IF NOT EXISTS project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_notes_project_id ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_created_by ON project_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_project_notes_created_at ON project_notes(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

-- Users can view notes for projects they have access to
CREATE POLICY "Users can view project notes for their projects"
  ON project_notes
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
    OR
    project_id IN (
      SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
    )
  );

-- Users can insert notes for projects they have access to
CREATE POLICY "Users can insert project notes for their projects"
  ON project_notes
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
    OR
    project_id IN (
      SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
    )
  );

-- Users can update their own notes
CREATE POLICY "Users can update their own project notes"
  ON project_notes
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete their own notes
CREATE POLICY "Users can delete their own project notes"
  ON project_notes
  FOR DELETE
  USING (created_by = auth.uid());
