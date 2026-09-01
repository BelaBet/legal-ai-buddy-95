
CREATE OR REPLACE FUNCTION public.store_clickup_token(p_user_id uuid, p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_name text;
  existing_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Não autorizado';
  END IF;
  IF p_token IS NULL OR length(trim(p_token)) = 0 OR length(p_token) > 500 THEN
    RAISE EXCEPTION 'Token inválido';
  END IF;

  secret_name := 'clickup_token_' || p_user_id::text;

  SELECT id INTO existing_id FROM vault.secrets WHERE name = secret_name;

  IF existing_id IS NOT NULL THEN
    UPDATE vault.secrets SET secret = p_token WHERE id = existing_id;
  ELSE
    INSERT INTO vault.secrets (name, secret) VALUES (secret_name, p_token);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_users_for_sharing(search_term text)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id != auth.uid()
    AND length(trim(coalesce(search_term, ''))) >= 3
    AND (p.full_name ILIKE '%' || search_term || '%')
  LIMIT 10;
$$;

REVOKE EXECUTE ON FUNCTION public.store_clickup_token(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.search_users_for_sharing(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.store_clickup_token(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_for_sharing(text) TO authenticated;
