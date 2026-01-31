-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view shared documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update shared documents with edit permission" ON public.documents;

-- Create policies without recursion by using a direct join approach
-- Policy for viewing own documents (already exists but let's ensure it's correct)
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a separate policy for shared documents using EXISTS with proper isolation
CREATE POLICY "Users can view shared documents" 
ON public.documents 
FOR SELECT 
USING (
  documents.id IN (
    SELECT ds.document_id 
    FROM public.document_shares ds 
    WHERE ds.shared_with = auth.uid()
  )
);

-- Create policy for editing shared documents
CREATE POLICY "Users can update shared documents with edit permission" 
ON public.documents 
FOR UPDATE 
USING (
  documents.id IN (
    SELECT ds.document_id 
    FROM public.document_shares ds 
    WHERE ds.shared_with = auth.uid() 
    AND ds.permission = 'edit'
  )
);