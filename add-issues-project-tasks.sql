-- Let an issue belong directly to a project (a "project task") instead of
-- only to a view, so Project Tasks can reuse the exact same issues table,
-- detail page, and status enum as View issues.
-- Safe to run on existing data: every existing row already has view_id set
-- and project_id NULL, which satisfies the check constraint below.

ALTER TABLE issues ALTER COLUMN view_id DROP NOT NULL;

ALTER TABLE issues ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);

-- Exactly one parent (view or project) must be set
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_parent_check;
ALTER TABLE issues ADD CONSTRAINT issues_parent_check CHECK (
  (view_id IS NOT NULL AND project_id IS NULL) OR
  (view_id IS NULL AND project_id IS NOT NULL)
);
