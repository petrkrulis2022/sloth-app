-- Add missing UPDATE policy for project_notes
-- Run this if you've already created the project_notes table

CREATE POLICY "Users can update their own project notes"
  ON project_notes
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
