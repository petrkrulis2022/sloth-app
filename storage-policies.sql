-- Storage Configuration for documents bucket
-- Copy and paste this entire file into Supabase SQL Editor

-- Option 1: Make bucket public (SIMPLEST - use this for MVP)
-- Run this in SQL Editor:
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete documents" ON storage.objects;

-- Allow anyone to upload to documents bucket
CREATE POLICY "Public upload to documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

-- Allow anyone to read from documents bucket
CREATE POLICY "Public read documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Allow anyone to update documents
CREATE POLICY "Public update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents');

-- Allow anyone to delete documents
CREATE POLICY "Public delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');
