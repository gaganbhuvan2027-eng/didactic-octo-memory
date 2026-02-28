-- Add difficulty column to interviews table
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'intermediate';

-- Add comment to explain the column
COMMENT ON COLUMN interviews.difficulty IS 'Difficulty level of the interview: beginner, intermediate, pro, or advanced';

-- Update existing interviews to have a default difficulty
UPDATE interviews 
SET difficulty = 'intermediate' 
WHERE difficulty IS NULL;
