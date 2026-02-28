-- Add interview_type to scope question history per interview type (dsa-arrays, aptitude-quant, etc.)
-- Enables querying "previous questions for this user in this interview type" for better variety

ALTER TABLE public.interview_questions_asked
ADD COLUMN IF NOT EXISTS interview_type TEXT;

-- Index for fast lookups: "get last N questions for user + interview type"
CREATE INDEX IF NOT EXISTS idx_questions_asked_user_type ON public.interview_questions_asked(user_id, interview_type);
