# Password Reset Setup & Configuration

This guide explains how the password reset functionality works and how to configure it properly.

## Overview

The password reset feature allows users to securely reset their password if they forget it. The flow works as follows:

1. User clicks "Forgot password?" on the sign-in modal
2. User enters their email address
3. Supabase sends a password reset email with a secure link
4. User clicks the link in the email
5. User is redirected to `/reset-password` page
6. User enters and confirms their new password
7. Password is updated and user is redirected to home page

## Files Involved

### 1. `components/AuthModal.tsx`
- Contains the "Forgot Password" UI
- Handles the password reset request
- Shows success/error messages

### 2. `contexts/AuthContext.tsx`
- Contains the `resetPassword()` function
- Calls Supabase's `resetPasswordForEmail()` API
- Configures the redirect URL

### 3. `app/reset-password/page.tsx`
- New page that handles the password reset flow
- Validates the reset token from the email link
- Allows user to set a new password
- Updates the password via Supabase

## Supabase Email Configuration

### Step 1: Configure Email Templates

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Find the **Reset Password** template
4. Customize the template if desired (optional)

The default template includes a link like:
```
{{ .ConfirmationURL }}
```

This will automatically redirect to your configured redirect URL.

### Step 2: Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set your **Site URL** to:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - Development: `http://localhost:3000/reset-password`
   - Production: `https://yourdomain.com/reset-password`

### Step 3: Email Provider Setup

#### For Development/Testing:
Supabase provides a built-in email service that works out of the box. However, it has rate limits and may be slow.

#### For Production:
Configure a custom SMTP provider for better deliverability:

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Enable "Enable Custom SMTP"
3. Configure your email provider:
   - **Gmail**: Use App Password (not your regular password)
   - **SendGrid**: Use API key as password
   - **AWS SES**: Use SMTP credentials
   - **Mailgun**: Use SMTP credentials

Example Gmail setup:
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-password (not regular password)
Sender email: your-email@gmail.com
Sender name: PostReady
```

## Testing the Password Reset Flow

### 1. Test Email Sending

1. Start your development server:
```bash
npm run dev
```

2. Open http://localhost:3000
3. Click "Sign In" in the top-right
4. Click "Forgot password?"
5. Enter a valid email address (must be a real email you can access)
6. Click "Send Reset Link"
7. Check your email inbox (and spam folder)

### 2. Test Password Reset Page

1. Click the link in the reset email
2. You should be redirected to `/reset-password`
3. Enter a new password (minimum 6 characters)
4. Confirm the password
5. Click "Reset Password"
6. You should see a success message and be redirected to home
7. Try signing in with your new password

## Troubleshooting

### "Failed to fetch" Error

**Cause**: Supabase credentials are not configured or incorrect.

**Solution**:
1. Check your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```
2. Restart your dev server after adding/changing env variables
3. Verify the credentials are correct in Supabase dashboard

### Email Not Received

**Cause**: Email provider issues or rate limiting.

**Solution**:
1. Check Supabase logs: **Authentication** → **Logs**
2. Check your spam/junk folder
3. Verify the email address is correct
4. If using built-in email, wait a few minutes (it can be slow)
5. For production, configure custom SMTP (see above)

### "Invalid or expired reset link"

**Cause**: The reset token has expired or is invalid.

**Solution**:
1. Reset tokens expire after 1 hour by default
2. Request a new password reset email
3. Use the link immediately after receiving it
4. Don't use the same link twice

### Redirect URL Mismatch

**Cause**: The redirect URL in code doesn't match Supabase configuration.

**Solution**:
1. Check `contexts/AuthContext.tsx` line 120:
```typescript
redirectTo: `${window.location.origin}/reset-password`
```
2. Ensure this matches the URL in Supabase **Authentication** → **URL Configuration**
3. Add the URL to the "Redirect URLs" allowlist

### Password Update Fails

**Cause**: Password doesn't meet requirements or session is invalid.

**Solution**:
1. Ensure password is at least 6 characters
2. Check browser console for specific errors
3. Try requesting a new reset link
4. Verify Supabase authentication is working (try sign in/sign up)

## Security Considerations

### Token Expiration
- Reset tokens expire after 1 hour (Supabase default)
- Tokens can only be used once
- After password reset, all existing sessions are invalidated

### Password Requirements
- Minimum 6 characters (can be increased in code)
- No maximum length
- Consider adding complexity requirements for production:
  - Uppercase and lowercase letters
  - Numbers
  - Special characters

### Rate Limiting
- Supabase automatically rate limits password reset requests
- Default: 4 requests per hour per email address
- This prevents abuse and spam

## Customization Options

### Change Password Requirements

Edit `app/reset-password/page.tsx` line 39:

```typescript
if (password.length < 8) { // Changed from 6 to 8
  setError('Password must be at least 8 characters long');
  return;
}
```

### Change Token Expiration

In Supabase dashboard:
1. Go to **Authentication** → **Auth** → **Settings**
2. Find "JWT expiry limit"
3. Adjust as needed (default is 3600 seconds = 1 hour)

### Customize Email Template

1. Go to **Authentication** → **Email Templates** → **Reset Password**
2. Edit the HTML/text content
3. Available variables:
   - `{{ .Email }}` - User's email
   - `{{ .Token }}` - Reset token
   - `{{ .TokenHash }}` - Token hash
   - `{{ .ConfirmationURL }}` - Full reset URL
   - `{{ .SiteURL }}` - Your site URL

### Change Redirect After Reset

Edit `app/reset-password/page.tsx` line 77:

```typescript
setTimeout(() => {
  router.push('/portal'); // Changed from '/' to '/portal'
}, 2000);
```

## Production Checklist

Before deploying to production:

- [ ] Configure custom SMTP provider
- [ ] Test email delivery
- [ ] Customize email templates with your branding
- [ ] Set production Site URL and Redirect URLs in Supabase
- [ ] Update environment variables in production
- [ ] Test the complete flow in production
- [ ] Consider adding password complexity requirements
- [ ] Monitor authentication logs for issues
- [ ] Set up email monitoring/alerts

## Additional Features to Consider

### Email Verification
Users should verify their email before they can reset their password. This is enabled by default in Supabase.

### Multi-Factor Authentication (MFA)
Add an extra layer of security with MFA. Supabase supports TOTP-based MFA.

### Account Recovery
Provide alternative recovery methods (security questions, backup codes, etc.)

### Password History
Prevent users from reusing recent passwords (requires custom implementation)

## Support

If you encounter issues:
1. Check Supabase logs: **Authentication** → **Logs**
2. Check browser console for errors
3. Review Supabase documentation: https://supabase.com/docs/guides/auth
4. Check PostReady GitHub issues

---

**Last Updated**: November 2024

