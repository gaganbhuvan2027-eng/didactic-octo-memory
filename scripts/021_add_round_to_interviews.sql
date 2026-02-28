-- Add round column to interviews (e.g. 'coding', 'technical') for course interviews
ALTER TABLE public.interviews
ADD COLUMN IF NOT EXISTS round TEXT;

COMMENT ON COLUMN public.interviews.round IS 'Interview round: coding, technical, etc. Used for course interviews to determine question type.';
