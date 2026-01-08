-- Ensure all columns in issues table have proper defaults
-- This fixes any NOT NULL constraints that might be causing 400 errors

-- Check and add default values for status if needed
ALTER TABLE issues ALTER COLUMN status SET DEFAULT 'not-started';

-- Ensure created_at and updated_at have defaults
ALTER TABLE issues ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE issues ALTER COLUMN updated_at SET DEFAULT NOW();

-- If there's a position column that shouldn't be there, you can remove it:
-- ALTER TABLE issues DROP COLUMN IF EXISTS position;
