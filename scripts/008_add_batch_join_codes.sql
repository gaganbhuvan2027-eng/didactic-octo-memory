-- Add join_code column to batches table
ALTER TABLE batches ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Generate unique join codes for existing batches
UPDATE batches 
SET join_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8))
WHERE join_code IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_batches_join_code ON batches(join_code);
