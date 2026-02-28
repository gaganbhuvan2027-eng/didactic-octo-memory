-- Create interview_reports table for user feedback during interviews
CREATE TABLE IF NOT EXISTS public.interview_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_types TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_reports_interview_id ON public.interview_reports(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_reports_user_id ON public.interview_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_reports_created_at ON public.interview_reports(created_at);

-- Allow authenticated users to insert their own reports
ALTER TABLE public.interview_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own reports" ON public.interview_reports;
CREATE POLICY "Users can insert own reports"
  ON public.interview_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow service role / admin to read all reports
GRANT ALL ON public.interview_reports TO service_role;
GRANT INSERT, SELECT ON public.interview_reports TO authenticated;

COMMENT ON TABLE public.interview_reports IS 'User-submitted reports/issues during interviews (e.g. no audio, unrelated question)';
