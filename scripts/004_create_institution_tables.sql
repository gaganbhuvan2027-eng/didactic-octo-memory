-- Create institutions table
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  email_domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add institution_id to users table to link users to institutions
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id);

ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'student'; -- 'student', 'institution_admin'

-- Create institution members table for tracking members added by admins
CREATE TABLE IF NOT EXISTS public.institution_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institution_id, user_id)
);

-- Create scheduled interviews table for institution-wide scheduling
CREATE TABLE IF NOT EXISTS public.scheduled_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  scheduled_by_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  difficulty TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample institutions
INSERT INTO public.institutions (name, email_domain) VALUES
('IIT Delhi', 'iitd.ac.in'),
('Delhi University', 'du.ac.in'),
('Manipal University', 'manipal.edu'),
('Jawaharlal Nehru University', 'jnu.ac.in'),
('IIT Bombay', 'iitb.ac.in')
ON CONFLICT (email_domain) DO NOTHING;
