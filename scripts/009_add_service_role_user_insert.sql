-- Add INSERT policy for users table to allow service role to insert user records
-- This is needed for interview creation where the API needs to ensure user records exist

-- First, check if the policy already exists and drop it if it does
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Add INSERT policy to allow service role (for API operations) to insert user records
CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- Also add a policy for authenticated users to insert their own profiles
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
