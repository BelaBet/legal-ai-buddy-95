-- Create ClickUp integration settings table
CREATE TABLE public.clickup_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  api_token TEXT NOT NULL,
  workspace_id TEXT,
  list_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.clickup_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for clickup_integrations (only supremo users can manage)
CREATE POLICY "Supremo users can view their own ClickUp integration"
ON public.clickup_integrations
FOR SELECT
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'supremo'));

CREATE POLICY "Supremo users can insert their own ClickUp integration"
ON public.clickup_integrations
FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'supremo'));

CREATE POLICY "Supremo users can update their own ClickUp integration"
ON public.clickup_integrations
FOR UPDATE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'supremo'));

CREATE POLICY "Supremo users can delete their own ClickUp integration"
ON public.clickup_integrations
FOR DELETE
USING (auth.uid() = user_id AND public.has_role(auth.uid(), 'supremo'));

-- Trigger for updated_at
CREATE TRIGGER update_clickup_integrations_updated_at
BEFORE UPDATE ON public.clickup_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();