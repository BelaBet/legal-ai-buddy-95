-- Track AI chat requests per user so the legal-chat edge function can
-- enforce a sliding-window rate limit and stop a single account from
-- burning through the OpenAI budget.
CREATE TABLE public.legal_chat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX legal_chat_requests_user_created_idx
  ON public.legal_chat_requests (user_id, created_at DESC);

ALTER TABLE public.legal_chat_requests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own request log (used by the edge function,
-- authenticated as the calling user, to count recent requests).
CREATE POLICY "Users can view their own chat request log"
ON public.legal_chat_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only log requests attributed to themselves.
-- No UPDATE/DELETE policy is defined on purpose: nobody (including the
-- request's own user) should be able to erase entries to dodge the limit.
CREATE POLICY "Users can log their own chat requests"
ON public.legal_chat_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
