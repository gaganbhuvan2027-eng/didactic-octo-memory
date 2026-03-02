# Custom Google OAuth Setup (India / Cloudflare Proxy)

This app uses a **custom Google OAuth flow** that routes through your domain instead of `supabase.co`. This avoids ISP blocks in India where some networks block Supabase.

**Flow:** User → Your app → Google → Your app callback → Supabase (server-side only)

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Add **Authorized redirect URIs**:
   - Production: `https://didactic-octo-memory-mjg9.vercel.app/api/auth/google/callback`
   - Local dev: `http://localhost:3000/api/auth/google/callback`
   - (Add your custom domain if you have one, e.g. `https://yourdomain.com/api/auth/google/callback`)
6. Copy **Client ID** and **Client Secret**

## 2. Add Environment Variables

Add to `.env.local` and Vercel:

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://didactic-octo-memory-mjg9.vercel.app/api/auth/google/callback
```

For local development:

```env
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

## 3. Supabase Configuration

- Google provider must be **enabled** in Supabase Dashboard → Auth → Providers
- You can keep Supabase’s own Google client for email/password users
- The custom flow uses `signInWithIdToken` and works with any valid Google id_token

## 4. Deploy

After adding env vars to Vercel, redeploy. Google sign-in will use the custom flow and avoid `supabase.co` in the browser.
