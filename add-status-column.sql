-- Add status column to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not-started';

-- Add check constraint to ensure valid status values
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE issues ADD CONSTRAINT issues_status_check 
  CHECK (status IN ('not-started', 'in-progress', 'done'));

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
