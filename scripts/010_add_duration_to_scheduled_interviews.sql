-- Add duration column to scheduled_interviews table (minutes)
ALTER TABLE public.scheduled_interviews
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30;

COMMENT ON COLUMN public.scheduled_interviews.duration IS 'Duration of the scheduled interview in minutes';
