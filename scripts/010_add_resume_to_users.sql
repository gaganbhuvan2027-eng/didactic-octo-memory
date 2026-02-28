-- Add resume_url and resume_data columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS resume_data JSONB;

-- Add comment explaining the columns
COMMENT ON COLUMN users.resume_url IS 'URL to the uploaded resume file in Vercel Blob storage';
COMMENT ON COLUMN users.resume_data IS 'Extracted data from resume (skills, experience, education, etc.)';
