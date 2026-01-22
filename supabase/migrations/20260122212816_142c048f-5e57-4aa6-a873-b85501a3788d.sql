-- Enable the pgsodium extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create function to store ClickUp token in vault
CREATE OR REPLACE FUNCTION public.store_clickup_token(p_user_id uuid, p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_name text := 'clickup_token_' || p_user_id::text;
  existing_id uuid;
BEGIN
  -- Check if secret already exists
  SELECT id INTO existing_id 
  FROM vault.secrets 
  WHERE name = secret_name;
  
  IF existing_id IS NOT NULL THEN
    -- Update existing secret
    UPDATE vault.secrets 
    SET secret = p_token
    WHERE id = existing_id;
  ELSE
    -- Create new secret
    INSERT INTO vault.secrets (name, secret)
    VALUES (secret_name, p_token);
  END IF;
END;
$$;

-- Create function to retrieve ClickUp token from vault
CREATE OR REPLACE FUNCTION public.get_clickup_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_name text := 'clickup_token_' || auth.uid()::text;
  token text;
BEGIN
  SELECT decrypted_secret INTO token
  FROM vault.decrypted_secrets
  WHERE name = secret_name;
  
  RETURN token;
END;
$$;

-- Create function to delete ClickUp token from vault
CREATE OR REPLACE FUNCTION public.delete_clickup_token()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_name text := 'clickup_token_' || auth.uid()::text;
BEGIN
  DELETE FROM vault.secrets
  WHERE name = secret_name;
END;
$$;

-- Migrate existing tokens to vault (if any exist)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN SELECT user_id, api_token FROM public.clickup_integrations WHERE api_token IS NOT NULL AND api_token != ''
  LOOP
    PERFORM public.store_clickup_token(rec.user_id, rec.api_token);
  END LOOP;
END $$;

-- Remove api_token column from clickup_integrations (tokens now in vault)
ALTER TABLE public.clickup_integrations DROP COLUMN IF EXISTS api_token;