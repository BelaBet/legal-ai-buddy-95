-- Create document shares table for sharing between users
CREATE TABLE public.document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, shared_with)
);

-- Enable RLS
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Document owner can manage shares
CREATE POLICY "Document owners can manage shares"
ON public.document_shares
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_shares.document_id 
    AND documents.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE documents.id = document_shares.document_id 
    AND documents.user_id = auth.uid()
  )
);

-- Policy: Users can view shares they received
CREATE POLICY "Users can view shares they received"
ON public.document_shares
FOR SELECT
TO authenticated
USING (shared_with = auth.uid());

-- Update documents RLS to allow viewing shared documents
CREATE POLICY "Users can view shared documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.document_shares 
    WHERE document_shares.document_id = documents.id 
    AND document_shares.shared_with = auth.uid()
  )
);

-- Policy for editing shared documents with edit permission
CREATE POLICY "Users can update shared documents with edit permission"
ON public.documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.document_shares 
    WHERE document_shares.document_id = documents.id 
    AND document_shares.shared_with = auth.uid()
    AND document_shares.permission = 'edit'
  )
);

-- Function to get user info for document display (avoiding direct profile access)
CREATE OR REPLACE FUNCTION public.get_document_owner_name(p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(full_name, 'Usuário') 
  FROM public.profiles 
  WHERE user_id = p_user_id
  LIMIT 1;
$$;

-- Function to search users for sharing
CREATE OR REPLACE FUNCTION public.search_users_for_sharing(search_term TEXT)
RETURNS TABLE(user_id UUID, full_name TEXT, avatar_url TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id != auth.uid()
    AND (p.full_name ILIKE '%' || search_term || '%')
  LIMIT 10;
$$;