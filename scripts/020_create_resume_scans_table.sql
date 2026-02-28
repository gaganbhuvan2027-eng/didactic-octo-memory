-- Create resume_scans table to store scan history
CREATE TABLE IF NOT EXISTS public.resume_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  overall_score INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  sections JSONB DEFAULT '[]'::jsonb,
  improvements TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  detailed_feedback TEXT,
  ats_score INTEGER DEFAULT 0,
  keyword_analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resume_scans_user_id ON public.resume_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_scans_created_at ON public.resume_scans(created_at DESC);

-- Enable RLS
ALTER TABLE public.resume_scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own resume scans" ON public.resume_scans;
DROP POLICY IF EXISTS "Service role can insert resume scans" ON public.resume_scans;
DROP POLICY IF EXISTS "Service role can update resume scans" ON public.resume_scans;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.resume_scans;
DROP POLICY IF EXISTS "Allow all for service role" ON public.resume_scans;

-- RLS Policies for resume_scans
-- Users can view their own resume scans
CREATE POLICY "Users can view their own resume scans"
  ON public.resume_scans FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own resume scans (for service role, it will bypass RLS anyway)
CREATE POLICY "Allow insert for authenticated users"
  ON public.resume_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Grant permissions to authenticated users
GRANT SELECT ON public.resume_scans TO authenticated;
GRANT INSERT ON public.resume_scans TO authenticated;

-- Grant all permissions to service_role (admin client)
GRANT ALL ON public.resume_scans TO service_role;
