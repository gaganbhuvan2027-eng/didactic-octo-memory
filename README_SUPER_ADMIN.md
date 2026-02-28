# Super Admin Login Setup

The super admin now has a dedicated login page with email and password authentication.

## Setup

### 1. Configure Credentials

Add super admin credentials to your `.env.local` file:

```env
# Format: email1:password1,email2:password2
SUPERADMIN_CREDENTIALS=admin@hiremind.app:admin123,another-admin@hiremind.app:password456

# OR use individual variables (backward compatible)
SUPERADMIN_EMAIL=admin@hiremind.app
SUPERADMIN_PASSWORD=admin123
```

### 2. Set Secret Key (Optional but Recommended)

```env
SUPERADMIN_SECRET_KEY=your-secret-key-here-change-in-production
```

## Usage

1. Navigate to `/super-admin/login`
2. Enter your email and password
3. You'll be redirected to the super admin dashboard
4. Click "Logout" when done

## Default Credentials

If no credentials are configured, the default is:
- **Email:** `admin@hiremind.app`
- **Password:** `admin123`

**⚠️ IMPORTANT:** Change these defaults in production!

## Security Notes

- Passwords are stored in environment variables (not in the database)
- Session tokens are stored in HTTP-only cookies
- Sessions expire after 7 days
- Always use strong passwords in production
- Consider using a secrets manager for production deployments

---

## Honeypot & Admin relocation (optional)

This repository supports an opt-in honeypot that places a fake `/admin` page in front of the real super-admin dashboard and moves the real admin UI to a secret path.

Configuration options (set in `.env.local`):

- `ADMIN_HONEYPOT_ENABLED=true` — enable the honeypot behavior
- `ADMIN_ALERT_WEBHOOK` — an HTTP/Discord/Slack webhook to receive instant alerts
- `REAL_ADMIN_PATH` — the secret path that rewrites to `/super-admin` (do not share this path)

Behavior when enabled:

- Requests to `/super-admin` are redirected to `/admin` (honeypot)
- The real admin UI is still served but *only* at the secret `REAL_ADMIN_PATH` by using Next.js rewrites
- All attempts to sign in to `/admin` are logged to `logs/honeypot.log` and trigger the configured webhook

To disable the honeypot, set `ADMIN_HONEYPOT_ENABLED=false` and restart the server.

## Legacy Support

The system still supports:
- Email allowlist via `SUPERADMIN_EMAILS`
- User role `super_admin` in Supabase metadata
- Passcode via URL parameter

But the new login system is the recommended approach.

