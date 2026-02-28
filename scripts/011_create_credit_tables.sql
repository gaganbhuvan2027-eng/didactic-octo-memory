-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create institution_usage table
CREATE TABLE IF NOT EXISTS public.institution_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  credits_used INTEGER NOT NULL DEFAULT 0,
  groq_calls INTEGER NOT NULL DEFAULT 0,
  period DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institution_id, period)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_institution_usage_institution_id ON public.institution_usage(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_usage_period ON public.institution_usage(period DESC);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credits
CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert and update user credits"
  ON public.user_credits FOR ALL
  TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert credit transactions"
  ON public.credit_transactions FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

-- RLS Policies for institution_usage (admins can view their institution's usage)
CREATE POLICY "Institution admins can view their institution usage"
  ON public.institution_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'institution_admin'
      AND users.institution_id = institution_usage.institution_id
    )
  );

CREATE POLICY "Service role can manage institution usage"
  ON public.institution_usage FOR ALL
  TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- Grant permissions to authenticated users
GRANT ALL ON public.user_credits TO authenticated;
GRANT ALL ON public.credit_transactions TO authenticated;
GRANT ALL ON public.institution_usage TO authenticated;

