-- Create table to track API usage for rate limiting
CREATE TABLE public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_api_usage_user_endpoint_window ON public.api_usage(user_id, endpoint, window_start);

-- Enable RLS
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Only allow service role to manage this table (edge functions use service role)
CREATE POLICY "Service role can manage api_usage" ON public.api_usage
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 30,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_current_count INTEGER;
  v_usage_id UUID;
BEGIN
  -- Calculate window start time
  v_window_start := date_trunc('hour', now()) + 
    (EXTRACT(MINUTE FROM now())::INTEGER / p_window_minutes) * (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get or create usage record for this window
  SELECT id, request_count INTO v_usage_id, v_current_count
  FROM public.api_usage
  WHERE user_id = p_user_id 
    AND endpoint = p_endpoint 
    AND window_start = v_window_start;
  
  IF v_usage_id IS NULL THEN
    -- Create new usage record
    INSERT INTO public.api_usage (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, v_window_start)
    RETURNING id, request_count INTO v_usage_id, v_current_count;
    
    RETURN QUERY SELECT 
      true AS allowed,
      (p_max_requests - 1) AS remaining,
      (v_window_start + (p_window_minutes || ' minutes')::INTERVAL) AS reset_at;
  ELSE
    IF v_current_count >= p_max_requests THEN
      -- Rate limit exceeded
      RETURN QUERY SELECT 
        false AS allowed,
        0 AS remaining,
        (v_window_start + (p_window_minutes || ' minutes')::INTERVAL) AS reset_at;
    ELSE
      -- Increment counter
      UPDATE public.api_usage 
      SET request_count = request_count + 1
      WHERE id = v_usage_id;
      
      RETURN QUERY SELECT 
        true AS allowed,
        (p_max_requests - v_current_count - 1) AS remaining,
        (v_window_start + (p_window_minutes || ' minutes')::INTERVAL) AS reset_at;
    END IF;
  END IF;
END;
$$;

-- Cleanup old records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_api_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_usage 
  WHERE window_start < now() - INTERVAL '24 hours';
END;
$$;