-- Migration 045: Add storage RLS policies for the 'videos' bucket
-- The bucket existed and was public (reads) but had zero INSERT/UPDATE/DELETE policies,
-- which silently blocked all video uploads. This caused context videos recorded by
-- Deaf users to never persist, so interpreters never saw them.
-- Applied via Supabase MCP (Monday 11763884476).

-- INSERT: authenticated users can upload videos
CREATE POLICY "authenticated_users_upload_videos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

-- SELECT: authenticated users can read videos (public bucket handles anonymous reads)
CREATE POLICY "authenticated_users_read_videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

-- UPDATE: authenticated users can update their own videos
CREATE POLICY "users_update_own_videos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'videos' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE: authenticated users can delete their own videos
CREATE POLICY "users_delete_own_videos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'videos' AND auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text);
