-- Add invite_code column to institutions table
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generate unique invite codes for existing institutions
UPDATE institutions 
SET invite_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT) FROM 1 FOR 8))
WHERE invite_code IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_institutions_invite_code ON institutions(invite_code);
