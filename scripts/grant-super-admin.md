# How to Grant Super Admin Access

There are three ways to grant super admin access:

## Method 1: Environment Variable (Easiest)

Add your email to the `SUPERADMIN_EMAILS` environment variable:

1. In your `.env.local` file (or your hosting platform's environment variables):
   ```
   SUPERADMIN_EMAILS=your-email@example.com,another-email@example.com
   ```

2. Restart your development server or redeploy

3. Log in with that email address

## Method 2: Set User Role in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Find your user account
5. Click on the user to edit
6. In the **User Metadata** section, add:
   ```json
   {
     "role": "super_admin"
   }
   ```
7. Save the changes
8. Log out and log back in

## Method 3: Use the API Endpoint

You can use the API endpoint to grant access programmatically:

```bash
curl -X POST http://localhost:3000/api/super-admin/grant-access \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "secret": "change-this-secret-key"
  }'
```

**Important:** Set `SUPERADMIN_SECRET_KEY` in your environment variables first, or use the default "change-this-secret-key" (not recommended for production).

## Method 4: Passcode (Temporary Access)

If you set `SUPERADMIN_PASSCODE` in your environment variables, you can access the super admin page by adding `?code=YOUR_PASSCODE` to the URL:

```
http://localhost:3000/super-admin?code=YOUR_PASSCODE
```

This grants temporary access without requiring role or email configuration.

## Troubleshooting

- Make sure you're logged in with the correct account
- Check that environment variables are set correctly
- Restart your server after changing environment variables
- Check the debug info shown on the access denied page
- Verify your email is spelled correctly (case-insensitive)

