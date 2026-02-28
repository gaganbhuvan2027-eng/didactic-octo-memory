-- Create institution_credits table
CREATE TABLE IF NOT EXISTS public.institution_credits (
  institution_id UUID PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create institution_credit_transactions table
CREATE TABLE IF NOT EXISTS public.institution_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_institution_credit_transactions_institution_id ON public.institution_credit_transactions(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_credit_transactions_created_at ON public.institution_credit_transactions(created_at DESC);

-- RLS
ALTER TABLE public.institution_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Institution admins can view their institution credits"
  ON public.institution_credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'institution_admin'
      AND users.institution_id = institution_credits.institution_id
    )
  );

CREATE POLICY "Service role can manage institution credits"
  ON public.institution_credits FOR ALL
  TO service_role
  USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Institution admins can view institution credit transactions"
  ON public.institution_credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_type = 'institution_admin'
      AND users.institution_id = institution_credit_transactions.institution_id
    )
  );

CREATE POLICY "Service role can insert institution credit transactions"
  ON public.institution_credit_transactions FOR INSERT
  TO service_role
  WITH CHECK (TRUE);

GRANT ALL ON public.institution_credits TO authenticated;
GRANT ALL ON public.institution_credit_transactions TO authenticated;
