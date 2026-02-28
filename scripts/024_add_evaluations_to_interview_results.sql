-- Add evaluations JSONB column to interview_results for per-question evaluation (DSA, Aptitude, Coding rounds)
ALTER TABLE public.interview_results
ADD COLUMN IF NOT EXISTS evaluations JSONB DEFAULT '{}';

COMMENT ON COLUMN public.interview_results.evaluations IS 'Per-question evaluation: Q1: Fully Correct, Q2: Partially Correct, etc. Used for DSA, Aptitude, and Coding rounds.';
