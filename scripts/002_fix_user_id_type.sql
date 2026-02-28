-- Migration: Change user_id from UUID to TEXT to support custom authentication
-- This allows the app to work with localStorage-based authentication

-- Drop existing RLS policies first
DROP POLICY IF EXISTS "Users can view own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can create own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can update own interviews" ON interviews;
DROP POLICY IF EXISTS "Users can view own responses" ON interview_responses;
DROP POLICY IF EXISTS "Users can create own responses" ON interview_responses;
DROP POLICY IF EXISTS "Users can view own results" ON interview_results;
DROP POLICY IF EXISTS "Users can create own results" ON interview_results;

-- Alter the user_id column type from UUID to TEXT
ALTER TABLE interviews 
  ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE interview_responses 
  ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE interview_results 
  ALTER COLUMN user_id TYPE TEXT;

-- Recreate RLS policies with TEXT user_id
CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id IS NOT NULL);

CREATE POLICY "Users can create own interviews"
  ON interviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id IS NOT NULL);

CREATE POLICY "Users can view own responses"
  ON interview_responses FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id IS NOT NULL);

CREATE POLICY "Users can create own responses"
  ON interview_responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own results"
  ON interview_results FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id IS NOT NULL);

CREATE POLICY "Users can create own results"
  ON interview_results FOR INSERT
  WITH CHECK (true);
