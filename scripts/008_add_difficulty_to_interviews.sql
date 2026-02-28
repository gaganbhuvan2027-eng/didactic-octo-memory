-- Add difficulty column to interviews table
ALTER TABLE interviews
ADD COLUMN IF NOT EXISTS difficulty text;

-- Add comment to explain the column
COMMENT ON COLUMN interviews.difficulty IS 'Difficulty level of the interview: beginner, intermediate, pro, or advanced';
