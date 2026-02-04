-- Drop the problematic policy that causes circular recursion
DROP POLICY IF EXISTS "Document owners can manage shares" ON public.document_shares;

-- Create separate policies for document_shares that don't reference the documents table directly
-- This avoids the circular reference: documents -> document_shares -> documents

-- Policy for SELECT: document owners can view shares they created
CREATE POLICY "Document owners can view their shares" 
ON public.document_shares 
FOR SELECT 
TO authenticated
USING (shared_by = auth.uid());

-- Policy for INSERT: users can share documents they own
-- We check ownership via shared_by column which must equal current user
CREATE POLICY "Users can create shares they own" 
ON public.document_shares 
FOR INSERT 
TO authenticated
WITH CHECK (shared_by = auth.uid());

-- Policy for UPDATE: users can update shares they created
CREATE POLICY "Users can update their shares" 
ON public.document_shares 
FOR UPDATE 
TO authenticated
USING (shared_by = auth.uid());

-- Policy for DELETE: users can delete shares they created
CREATE POLICY "Users can delete their shares" 
ON public.document_shares 
FOR DELETE 
TO authenticated
USING (shared_by = auth.uid());