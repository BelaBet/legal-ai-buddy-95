-- Atomic application-level AI credits.
-- A new account starts with 20 credits; production plans can grant more later.
CREATE TABLE IF NOT EXISTS public.ai_credit_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 20 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason TEXT NOT NULL,
  request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own AI credit account" ON public.ai_credit_accounts;
CREATE POLICY "Users can view own AI credit account"
ON public.ai_credit_accounts FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own AI credit ledger" ON public.ai_credit_ledger;
CREATE POLICY "Users can view own AI credit ledger"
ON public.ai_credit_ledger FOR SELECT
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.reserve_ai_credit(p_request_id UUID DEFAULT NULL)
RETURNS TABLE(approved BOOLEAN, balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_balance INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.ai_credit_accounts(user_id, balance)
  VALUES (v_user, 20)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.ai_credit_accounts
  SET balance = balance - 1, updated_at = now()
  WHERE user_id = v_user AND balance > 0
  RETURNING ai_credit_accounts.balance INTO v_balance;

  IF v_balance IS NULL THEN
    SELECT a.balance INTO v_balance FROM public.ai_credit_accounts a WHERE a.user_id = v_user;
    RETURN QUERY SELECT FALSE, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  INSERT INTO public.ai_credit_ledger(user_id, amount, balance_after, reason, request_id)
  VALUES (v_user, -1, v_balance, 'ai_request_reserved', p_request_id);

  RETURN QUERY SELECT TRUE, v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_ai_credit(p_request_id UUID DEFAULT NULL)
RETURNS TABLE(refunded BOOLEAN, balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_balance INTEGER;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_request_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.ai_credit_ledger
    WHERE user_id = v_user AND request_id = p_request_id AND reason = 'ai_request_refunded'
  ) THEN
    SELECT a.balance INTO v_balance FROM public.ai_credit_accounts a WHERE a.user_id = v_user;
    RETURN QUERY SELECT FALSE, COALESCE(v_balance, 0);
    RETURN;
  END IF;

  UPDATE public.ai_credit_accounts
  SET balance = balance + 1, updated_at = now()
  WHERE user_id = v_user
  RETURNING ai_credit_accounts.balance INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  INSERT INTO public.ai_credit_ledger(user_id, amount, balance_after, reason, request_id)
  VALUES (v_user, 1, v_balance, 'ai_request_refunded', p_request_id);

  RETURN QUERY SELECT TRUE, v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_credit(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_ai_credit(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_ai_credit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_ai_credit(UUID) TO authenticated;

CREATE INDEX IF NOT EXISTS ai_credit_ledger_user_created_idx
ON public.ai_credit_ledger(user_id, created_at DESC);
