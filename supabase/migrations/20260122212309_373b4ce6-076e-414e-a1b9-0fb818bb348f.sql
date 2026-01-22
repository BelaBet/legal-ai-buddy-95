-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can upload event files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view event files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their event files" ON storage.objects;

-- Create user-scoped policies
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'event-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);