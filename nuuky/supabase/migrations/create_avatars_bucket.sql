-- Create avatars storage bucket RLS policies
-- NOTE: The RLS policies below have been applied via Supabase MCP
-- The storage bucket itself must be created via REST API or Dashboard
-- 
-- To create the bucket:
-- Option 1: Run the script: node create-avatars-bucket.js (requires SUPABASE_SERVICE_KEY in .env)
-- Option 2: Create manually in Supabase Dashboard:
--   1. Go to Storage → Create bucket
--   2. Name: "avatars"
--   3. Public: true
--   4. File size limit: 5MB
--   5. Allowed MIME types: image/*

-- RLS Policy: Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Allow public read access to avatars
CREATE POLICY "Public can read avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
