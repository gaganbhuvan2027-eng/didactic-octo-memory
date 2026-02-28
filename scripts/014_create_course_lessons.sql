-- 014_create_course_lessons.sql
-- Create course lessons table for storing course content

BEGIN;

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  lesson_slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  "order" integer DEFAULT 0,
  created_by_id uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE (course_id, lesson_slug)
);

CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons (course_id);

COMMIT;