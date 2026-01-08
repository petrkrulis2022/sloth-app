-- Add issue_id column to issues table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ogrbtmbmxyqyvwkajdrw/sql/new

ALTER TABLE issues
ADD COLUMN IF NOT EXISTS issue_id TEXT;

-- Create index for faster lookups by issue_id
CREATE INDEX IF NOT EXISTS idx_issues_issue_id ON issues(issue_id);

-- Optional: Add comment to column
COMMENT ON COLUMN issues.issue_id IS 'User-defined issue identifier (e.g., MVP-001, DEV-001)';
