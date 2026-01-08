-- Add development_notes column to issues table
-- This column will store technical notes and implementation details for issues
-- Safe to run on existing data - existing issues will have NULL values

ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS development_notes TEXT;

-- Add index for better query performance when filtering by development notes
CREATE INDEX IF NOT EXISTS idx_issues_development_notes 
ON issues(development_notes) 
WHERE development_notes IS NOT NULL;
