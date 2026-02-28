-- Add correct_answers_count column to interview_results table
ALTER TABLE interview_results
ADD COLUMN correct_answers_count VARCHAR(10);

