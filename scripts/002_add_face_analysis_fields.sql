-- Add face analysis fields to interview_results table
ALTER TABLE public.interview_results
ADD COLUMN IF NOT EXISTS eye_contact_score INTEGER,
ADD COLUMN IF NOT EXISTS smile_score INTEGER,
ADD COLUMN IF NOT EXISTS stillness_score INTEGER,
ADD COLUMN IF NOT EXISTS face_confidence_score INTEGER;

-- Add comment to explain the new fields
COMMENT ON COLUMN public.interview_results.eye_contact_score IS 'Average eye contact score (0-100) from face analysis during interview';
COMMENT ON COLUMN public.interview_results.smile_score IS 'Average smile detection score (0-100) from face analysis during interview';
COMMENT ON COLUMN public.interview_results.stillness_score IS 'Average stillness score (0-100) from face analysis during interview';
COMMENT ON COLUMN public.interview_results.face_confidence_score IS 'Overall face confidence score (0-100) calculated from eye contact, smile, and stillness';
