-- Add additional profile fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Add comment to describe the structure
COMMENT ON COLUMN public.users.skills IS 'Array of skill strings: ["JavaScript", "React", "Node.js"]';
COMMENT ON COLUMN public.users.education IS 'Array of education objects: [{"degree": "BS Computer Science", "school": "MIT", "year": "2020"}]';
COMMENT ON COLUMN public.users.experience IS 'Array of experience objects: [{"title": "Software Engineer", "company": "Google", "duration": "2020-2023"}]';
COMMENT ON COLUMN public.users.social_links IS 'Object with social links: {"linkedin": "url", "github": "url", "twitter": "url"}';
COMMENT ON COLUMN public.users.preferences IS 'User preferences: {"notifications": true, "theme": "light"}';
