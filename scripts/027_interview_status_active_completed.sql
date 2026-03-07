-- Interview concurrency: use status 'active' | 'completed'
-- Migrate existing in_progress -> active, keep completed as-is
UPDATE public.interviews SET status = 'active' WHERE status = 'in_progress';

ALTER TABLE public.interviews
  ALTER COLUMN status SET DEFAULT 'active';
