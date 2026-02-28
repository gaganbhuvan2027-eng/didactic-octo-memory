-- Add INSERT policy for users table to allow authenticated users to insert their own profiles
-- This is needed for interview creation where users might not have a profile yet

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add INSERT policy to allow authenticated users to create their own user profiles
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure other policies exist
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);
