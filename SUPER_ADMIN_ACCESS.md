# Super Admin Access Guide

## Security Setup

The super admin dashboard uses a honeypot system to protect against unauthorized access attempts.

### Access URLs

- **Public URL** (Honeypot): `/super-admin` → Redirects to fake `/admin` page
- **Real URL**: Check your `.env.local` for `REAL_ADMIN_PATH` (e.g., `/hidden-admin-3fa9b2c7`)

### Login Credentials

Set in `.env.local`:
```env
SUPERADMIN_EMAIL=admin@hiremind.app
SUPERADMIN_PASSWORD=admin123

# Or use multiple credentials:
SUPERADMIN_CREDENTIALS=admin1@example.com:pass1,admin2@example.com:pass2
```

### How to Access

1. Navigate to the **real admin path** from `.env.local` (not `/super-admin`)
2. You'll be redirected to the login page
3. Enter your email and password
4. After successful login, you'll be redirected to the dashboard

### Session Management

- Sessions last for 7 days
- Sessions are stored server-side for security
- Use the "Logout" button to properly end your session
- After logout, you must login again to access the dashboard

### Health Check Feature

Once logged in, navigate to the "Health Check" tab to:
- Monitor system status (Database, Auth, API, Environment)
- View service latency
- Download health reports
- Copy diagnostics for troubleshooting

### Important Notes

- **Never share the real admin path** - it's your secret URL
- Change default credentials in production
- The honeypot will alert you (via webhook) when someone tries to access the fake admin page
- If you forget your real admin path, check `REAL_ADMIN_PATH` in `.env.local`

### Troubleshooting

**Can't access after login:**
- Clear your browser cookies
- Check that the dev server is running
- Verify credentials in `.env.local`

**Health check not showing:**
- Click the "Refresh" button
- Check browser console for errors
- Verify you're logged in (check for "Logout" button)

**Redirected to /admin:**
- You're using the wrong URL
- Use the secret path from `REAL_ADMIN_PATH` in `.env.local`

