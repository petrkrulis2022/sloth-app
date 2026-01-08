-- Add position column to views table for drag-and-drop reordering
ALTER TABLE views ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Set initial positions based on created_at for existing views
UPDATE views SET position = subquery.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) as row_num
  FROM views
) AS subquery
WHERE views.id = subquery.id;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_views_position ON views(project_id, position);
