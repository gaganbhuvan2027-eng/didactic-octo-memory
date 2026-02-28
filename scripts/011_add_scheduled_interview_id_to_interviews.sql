-- Add scheduled_interview_id to interviews to link a run back to the schedule (nullable)
ALTER TABLE public.interviews
ADD COLUMN IF NOT EXISTS scheduled_interview_id UUID REFERENCES public.scheduled_interviews(id);

CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_interview_id ON public.interviews(scheduled_interview_id);

COMMENT ON COLUMN public.interviews.scheduled_interview_id IS 'Optional link to a scheduled_interviews row when this interview was started from a schedule';
