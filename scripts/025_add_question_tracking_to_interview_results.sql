-- Add question tracking columns to interview_results (total, answered, wrong, not answered)
ALTER TABLE public.interview_results ADD COLUMN IF NOT EXISTS total_questions INTEGER;
ALTER TABLE public.interview_results ADD COLUMN IF NOT EXISTS answered_questions INTEGER;
ALTER TABLE public.interview_results ADD COLUMN IF NOT EXISTS wrong_answers_count INTEGER DEFAULT 0;
ALTER TABLE public.interview_results ADD COLUMN IF NOT EXISTS not_answered_questions_count INTEGER;
