# Supabase Proxy (India ISP Block Workaround)

When custom domain + Cloudflare still gets blocked, proxy **all** Supabase traffic through your Vercel app. The user's browser never hits `supabase.co`.

## How It Works

```
User (India) → mockzen.com (or your domain) → Vercel server → Supabase
```

- REST API (database, storage, auth) → proxied ✓
- **Cookie forwarding** → Cookie and Set-Cookie headers forwarded for auth sessions ✓
- Google OAuth → use custom flow (see GOOGLE_OAUTH_SETUP.md) ✓
- Email confirmation → server-side `/auth/confirm` route ✓
- Realtime (WebSockets) → not supported; disable if you use it

## Setup

### 1. Environment Variables

**Keep these** (real Supabase URL for the proxy route):

```env
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Set this** to your proxy URL:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mockzen.com/api/supabase-proxy
```

Use your actual app URL (e.g. `https://mockzen.com` or `https://didactic-octo-memory-mjg9.vercel.app`).

### 2. Supabase Auth Redirect URLs

In Supabase Dashboard → Auth → URL Configuration:

- **Site URL:** `https://mockzen.com`
- **Redirect URLs:** Add `https://mockzen.com/auth/confirm` and `https://mockzen.com/auth/callback`

### 3. Email Templates (Required for India)

Supabase's default confirmation links go to `supabase.co` (blocked). You must customize each template you use.

**Confirm signup** (email/password signup):

1. Supabase Dashboard → Auth → Email Templates → **Confirm signup**
2. Replace the confirmation link with:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

**Magic link** (passwordless email login):

1. Auth → Email Templates → **Magic link**
2. Replace the link with:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">Log in</a>
```

**Reset password** (recovery):

1. Auth → Email Templates → **Reset password**
2. Replace the link with:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
```

**Important:** Use the exact variable names `{{ .TokenHash }}` and `{{ .SiteURL }}` (case-sensitive). Ensure **Site URL** in Auth → URL Configuration matches your app (e.g. `https://mockzen.com`).

### 4. Deploy

Redeploy after updating env vars. Email login and signup will work through the proxy.

### 5. Local Dev

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000/api/supabase-proxy
SUPABASE_URL=https://your-project.supabase.co
```

## Reverting

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

## Combined with Google OAuth

For full India compatibility:

1. **Google login** → Custom OAuth (GOOGLE_OAUTH_SETUP.md)
2. **Email login + confirmation** → This proxy + `/auth/confirm`
