-- Create a security definer function for admin access to profiles
-- This function excludes sensitive fields (phone, oab_number) from admin view
CREATE OR REPLACE FUNCTION public.get_profiles_for_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  specialty text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.specialty,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE public.has_role(auth.uid(), 'admin')
$$;

-- Drop the admin SELECT policy on profiles table
-- Admins will now use the function which excludes sensitive data
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;