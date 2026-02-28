-- Create batch_courses table to associate courses with batches
CREATE TABLE IF NOT EXISTS public.batch_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  created_by_id UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_courses_batch ON public.batch_courses(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_courses_course ON public.batch_courses(course_id);
