-- Remove the foreign key constraint from interviews table
-- This allows interviews to be created without requiring users in a separate table

ALTER TABLE IF EXISTS public.interviews 
DROP CONSTRAINT IF EXISTS interviews_user_id_fkey;

-- Disable RLS on users table to allow admin operations
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.interviews TO authenticated;
GRANT ALL ON public.interview_responses TO authenticated;
GRANT ALL ON public.interview_results TO authenticated;
