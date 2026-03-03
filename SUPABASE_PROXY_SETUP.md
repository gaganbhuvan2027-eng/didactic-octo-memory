# Supabase Proxy (India ISP Block Workaround)

When custom domain + Cloudflare still gets blocked, proxy **all** Supabase traffic through your Vercel app. The user's browser never hits `supabase.co`.

## How It Works

```
User (India) → your-app.vercel.app → Vercel server → Supabase
```

- REST API (database, storage, auth session refresh) → proxied ✓
- Google OAuth → use custom flow (already set up) ✓
- Realtime (WebSockets) → not supported by this proxy; disable if you use it

## Setup

### 1. Environment Variables

**Keep these as-is** (real Supabase URL for the proxy route):

```env
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Change this** in Vercel (and `.env.local` for local dev when testing proxy):

```env
NEXT_PUBLIC_SUPABASE_URL=https://didactic-octo-memory-mjg9.vercel.app/api/supabase-proxy
```

Use your actual app URL (Vercel or custom domain).

### 2. Deploy

Redeploy after updating env vars. All Supabase requests will go through your app.

### 3. Local Dev

For local testing with proxy:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3000/api/supabase-proxy
SUPABASE_URL=https://your-project.supabase.co
```

## Reverting

To use Supabase directly again:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

## Combined with Google OAuth

For full India compatibility:

1. **Google login** → Custom OAuth (see GOOGLE_OAUTH_SETUP.md)
2. **Database, storage, auth refresh** → This proxy

Both work together.
