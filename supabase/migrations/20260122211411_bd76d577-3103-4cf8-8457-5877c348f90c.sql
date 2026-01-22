-- Update handle_new_user() with input validation and sanitization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_name TEXT;
BEGIN
  -- Validate and sanitize full_name
  safe_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    'User'
  );
  
  -- Enforce length limit (max 100 characters)
  IF LENGTH(safe_name) > 100 THEN
    safe_name := SUBSTRING(safe_name FROM 1 FOR 100);
  END IF;
  
  -- Remove any potential HTML/script tags (basic sanitization)
  safe_name := REGEXP_REPLACE(safe_name, '<[^>]*>', '', 'g');
  
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, safe_name);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Add documentation comment for future developers
COMMENT ON FUNCTION public.handle_new_user() IS 
  'SECURITY DEFINER function - review carefully before modifications. 
   Runs with elevated privileges during user registration.
   Input is sanitized: trimmed, length-limited to 100 chars, HTML tags stripped.';