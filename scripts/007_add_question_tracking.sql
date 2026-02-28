-- Add question tracking table to prevent repetition
CREATE TABLE IF NOT EXISTS public.interview_questions_asked (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_hash TEXT NOT NULL,
  question_text TEXT NOT NULL,
  is_important BOOLEAN DEFAULT FALSE,
  times_asked INTEGER DEFAULT 1,
  last_asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_hash)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_questions_asked_user_id ON public.interview_questions_asked(user_id);

-- Enable RLS
ALTER TABLE public.interview_questions_asked ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own question history"
  ON public.interview_questions_asked FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question history"
  ON public.interview_questions_asked FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question history"
  ON public.interview_questions_asked FOR UPDATE
  USING (auth.uid() = user_id);
