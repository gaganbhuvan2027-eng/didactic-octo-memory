# Authentication Setup Guide

## Current Status

The application now uses **Supabase Authentication** for secure user management.

## What's Implemented

### 1. Authentication Pages
- **Login/Signup Page** (`/auth`): Users can create accounts and log in with email/password
- **Auth Confirm** (`/auth/confirm/route.ts`): Handles magic link and email confirmation → redirects to `/dashboard`
- **Auth Callback** (`/auth/callback/route.ts`): Handles OAuth (Google) redirects → redirects to `/dashboard`

### 2. Protected Routes
- **Middleware** (`middleware.ts`): Automatically refreshes sessions and protects routes
- **Dashboard** (`/dashboard`): Requires authentication, redirects to `/auth` if not logged in
- **Interview Pages**: Check authentication before starting interviews

### 3. Database Integration
- **Users Table**: Stores user profiles (id, email, name)
- **Interviews Table**: Stores interview sessions linked to users
- **Interview Responses**: Stores Q&A pairs from interviews
- **Interview Results**: Stores performance analysis

## Required Database Setup

**IMPORTANT**: Run this SQL script in your Supabase SQL Editor to fix the foreign key constraint:

\`\`\`sql
-- Remove the foreign key constraint from interviews table
ALTER TABLE IF EXISTS public.interviews 
DROP CONSTRAINT IF EXISTS interviews_user_id_fkey;

-- Disable RLS on users table to allow admin operations
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.interviews TO authenticated;
GRANT ALL ON public.interview_responses TO authenticated;
GRANT ALL ON public.interview_results TO authenticated;
\`\`\`

## How It Works

1. **User Signs Up**: Creates account via `/auth`, receives confirmation email
2. **User Logs In**: Authenticates via Supabase, session stored in cookies
3. **Middleware**: Refreshes session on every request, protects routes
4. **Dashboard Access**: Only accessible to authenticated users
5. **Start Interview**: Uses authenticated user's ID to create interview sessions
6. **Results**: Linked to user's account for history tracking

## Testing Authentication

1. Go to `/auth`
2. Click "Signup" tab
3. Enter email and password (min 6 characters)
4. Check email for confirmation link
5. Click confirmation link
6. Log in with your credentials
7. You'll be redirected to `/dashboard`

## Troubleshooting

### "Failed to start interview" Error
- **Cause**: Foreign key constraint blocking interview creation
- **Fix**: Run the SQL script above in Supabase SQL Editor

### "User not authenticated" Error
- **Cause**: Session expired or user not logged in
- **Fix**: Log in again at `/auth`

### Email Confirmation Not Received
- **Check**: Supabase email settings in dashboard
- **Fix**: Enable email confirmation in Supabase Auth settings

### Magic Link / Confirmation Link Not Working
- **Check**: Supabase **Authentication** → **URL Configuration** → Redirect URLs must include `https://www.mockzen.in/auth/confirm`
- **Check**: Email templates must use `/auth/confirm` (not `/onboarding`). See [SUPABASE_EMAIL_SETUP.md](./SUPABASE_EMAIL_SETUP.md)

## Environment Variables

Required variables (already configured):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Custom Google OAuth (India / ISP block workaround)

For Google sign-in that avoids `supabase.co` in the browser (fixes blocks in India):

- `GOOGLE_CLIENT_ID` – from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` – from Google Cloud Console
- `GOOGLE_REDIRECT_URI` – e.g. `https://www.mockzen.in/api/auth/google/callback`

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for setup.
