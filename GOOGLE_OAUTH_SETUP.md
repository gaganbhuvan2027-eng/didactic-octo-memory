# Google OAuth Setup (Supabase Native)

This app uses **Supabase's native Google OAuth**. No `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` in `.env.local` — configure everything in Supabase Dashboard.

**Flow:** User → Supabase → Google → Supabase → Your app `/auth/callback`

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Add **Authorized redirect URIs**:
   - `https://nrjgfxxjrbmxcsscedbr.supabase.co/auth/v1/callback`
   - (Add `http://localhost:54321/auth/v1/callback` if using Supabase local dev)
6. Copy **Client ID** and **Client Secret**

## 2. Configure Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your project
2. **Auth** → **Providers** → **Google** → Enable
3. Paste **Client ID** and **Client Secret** from step 1
4. Save

## 3. Supabase Redirect URLs

In **Auth** → **URL Configuration** → **Redirect URLs**, add:

- `https://www.mockzen.in/auth/callback` (production)
- `http://localhost:3000/auth/callback` (local dev)
- Add your Vercel URL if different, e.g. `https://your-app.vercel.app/auth/callback`

## 4. Deploy

No env vars needed. Redeploy and Google sign-in will work.
