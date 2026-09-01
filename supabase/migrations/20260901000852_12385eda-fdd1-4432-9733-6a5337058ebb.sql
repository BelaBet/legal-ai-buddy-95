
-- 1. Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_api_usage() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_document_owner_name(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_clickup_token() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_clickup_token() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.store_clickup_token(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_profiles_for_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.search_users_for_sharing(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.get_clickup_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_clickup_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_clickup_token(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_for_sharing(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_api_usage() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_document_owner_name(uuid) TO service_role;

-- 2. api_usage: allow users to read their own usage rows
GRANT SELECT ON public.api_usage TO authenticated;
DROP POLICY IF EXISTS "Users can view their own api usage" ON public.api_usage;
CREATE POLICY "Users can view their own api usage"
ON public.api_usage FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. event-files storage: validate ownership against events + add UPDATE policy
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'event-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.user_id = auth.uid()
      AND e.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.user_id = auth.uid()
      AND e.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'event-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.user_id = auth.uid()
      AND e.id::text = (storage.foldername(name))[2]
  )
)
WITH CHECK (
  bucket_id = 'event-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.user_id = auth.uid()
      AND e.id::text = (storage.foldername(name))[2]
  )
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.user_id = auth.uid()
      AND e.id::text = (storage.foldername(name))[2]
  )
);
