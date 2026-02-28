-- Add deadline column to scheduled_interviews table
ALTER TABLE public.scheduled_interviews
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Add a comment to explain the deadline field
COMMENT ON COLUMN public.scheduled_interviews.deadline IS 'The deadline time after which the interview expires and cannot be started';
