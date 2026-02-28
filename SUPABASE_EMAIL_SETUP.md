# Supabase Email Configuration Guide

## Issue: Authentication Emails Not Being Sent

If users are not receiving confirmation emails after signup, you need to configure email settings in your Supabase project.

## Quick Fix: Disable Email Confirmation (Development Only)

For development and testing, you can disable email confirmation:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Email**
4. Scroll down to **Email Confirmation**
5. **Uncheck** "Enable email confirmations"
6. Click **Save**

Now users can sign up and immediately access the app without email verification.

## Production Setup: Configure Email Provider

For production, you should enable email confirmation and configure a proper email provider:

### Option 1: Use Supabase's Built-in Email (Limited)
- Supabase provides limited email sending for free tier
- Good for testing but has rate limits
- Already configured by default

### Option 2: Configure Custom SMTP (Recommended for Production)

1. Go to **Authentication** → **Email Templates**
2. Click **Settings** (gear icon)
3. Configure your SMTP settings:
   - **SMTP Host**: Your email provider's SMTP server
   - **SMTP Port**: Usually 587 or 465
   - **SMTP Username**: Your email account
   - **SMTP Password**: Your email password or app-specific password
   - **Sender Email**: The "from" email address
   - **Sender Name**: Your app name (e.g., "HireMind")

### Popular SMTP Providers:
- **SendGrid**: Free tier available, easy setup
- **Mailgun**: Good for transactional emails
- **AWS SES**: Cost-effective for high volume
- **Gmail**: Can be used for testing (requires app password)

## Email Templates

Customize your email templates in **Authentication** → **Email Templates**:
- Confirmation email
- Password reset email
- Magic link email
- Email change confirmation

## Redirect URLs

Make sure your redirect URLs are configured:

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL: `https://your-domain.com`
3. Add redirect URLs:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

## Current Workaround

The app now handles both scenarios:
- **Email confirmation disabled**: Users are immediately logged in after signup
- **Email confirmation enabled**: Users see a message to check their email, then can login after confirming

## Developer diagnostic endpoint

For development and local debugging, the app exposes a server endpoint that will attempt an admin resend and report provider errors to help diagnose SMTP/provider misconfiguration:

- POST `/api/supabase-email/dev-resend` with JSON body `{ "email": "user@example.com" }` (only allowed in development or when `SUPERADMIN_SECRET_KEY` is provided via `x-admin-secret` header in production)

This can help surface provider errors reported by Supabase (e.g., SMTP authentication or delivery issues).

## Guest Login

Guest login now works by creating temporary accounts with random credentials, bypassing the need for email confirmation entirely.

## Testing note

In CI or locally you can set `SUPABASE_TEST_EMAIL=true` to make the test suite require successful email delivery for the resend test (`test/auth_resend.test.js`). Without this the test will tolerate provider errors and only warn (to avoid flaky CI when SMTP is not configured).
