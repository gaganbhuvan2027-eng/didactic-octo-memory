-- Add skipped field to interview_responses table
ALTER TABLE public.interview_responses
ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT FALSE;

-- Add questions_skipped field to interview_results table
ALTER TABLE public.interview_results
ADD COLUMN IF NOT EXISTS questions_skipped INTEGER DEFAULT 0;

-- Add skip_penalty field to interview_results table
ALTER TABLE public.interview_results
ADD COLUMN IF NOT EXISTS skip_penalty INTEGER DEFAULT 0;
