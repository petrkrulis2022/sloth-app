-- Add icon column to views table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ogrbtmbmxyqyvwkajdrw/sql/new

ALTER TABLE views
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Set default icon for existing views
UPDATE views
SET icon = '📋'
WHERE icon IS NULL;
