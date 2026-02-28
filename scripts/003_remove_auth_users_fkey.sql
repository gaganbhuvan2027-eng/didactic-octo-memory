-- Remove the foreign key constraint to auth.users since we're using localStorage auth
-- This allows us to insert interviews without requiring users in Supabase Auth

ALTER TABLE public.interviews 
DROP CONSTRAINT IF EXISTS interviews_user_id_fkey;

-- Disable RLS since we're using localStorage authentication and service role key
ALTER TABLE public.interviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_results DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies since they reference auth.uid() which won't work with localStorage auth
DROP POLICY IF EXISTS "Users can view their own interviews" ON public.interviews;
DROP POLICY IF EXISTS "Users can insert their own interviews" ON public.interviews;
DROP POLICY IF EXISTS "Users can update their own interviews" ON public.interviews;
DROP POLICY IF EXISTS "Users can view their own interview responses" ON public.interview_responses;
DROP POLICY IF EXISTS "Users can insert their own interview responses" ON public.interview_responses;
DROP POLICY IF EXISTS "Users can view their own interview results" ON public.interview_results;
DROP POLICY IF EXISTS "Users can insert their own interview results" ON public.interview_results;
