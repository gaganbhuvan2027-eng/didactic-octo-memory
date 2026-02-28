-- Add question_count to interviews table (used by start/prepare and analyze)
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS question_count INTEGER;
