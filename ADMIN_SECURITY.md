# Admin Dashboard Security Setup

## 🔒 Password Protection

The admin dashboard at `/admin/page-analyses` is now protected with password authentication.

### Default Password
```
PostReady2025!
```

### Changing the Admin Password

**Option 1: Hardcoded (Current Setup)**
Edit `app/admin/page-analyses/page.tsx` line 45:
```typescript
if (password === 'YOUR_NEW_PASSWORD_HERE') {
```

**Option 2: Environment Variable (Recommended for Production)**

1. Add to your `.env.local`:
```env
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_password_here
```

2. Update `app/admin/page-analyses/page.tsx` line 45:
```typescript
if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
```

⚠️ **Security Note:** Using `NEXT_PUBLIC_` exposes the variable to the client. For better security, consider implementing a proper authentication system with server-side validation.

## 🔐 Security Features Implemented

### 1. Password Protection
- ✅ Password required to access dashboard
- ✅ Session-based authentication (persists during browser session)
- ✅ Logout functionality
- ✅ Error handling for incorrect passwords

### 2. Data Export
- ✅ Export all analyses to CSV format
- ✅ Includes all user information and metadata
- ✅ Timestamped filenames
- ✅ One-click download

### 3. Permanent Deletion
- ✅ Delete individual analyses
- ✅ Automatically deletes associated screenshots from storage
- ✅ Confirmation dialog before deletion
- ✅ Cannot be undone (permanent)

### 4. User Consent
- ✅ Privacy notice on Page Analyzer tool
- ✅ Link to Privacy Policy
- ✅ Clear disclosure about data storage

## 📊 Dashboard Features

### View Analyses
- List all submitted analyses
- View extracted user information
- See screenshots and AI analysis
- Sortable by date (newest first)

### Export Data
- Download all data as CSV
- Includes: ID, username, name, followers, posts, bio links, social link, timestamp
- Useful for backups and analytics

### Delete Analyses
- Permanently remove individual analyses
- Deletes both database record and screenshot
- Confirmation required
- Real-time UI updates

## 🚀 Accessing the Dashboard

1. Navigate to: `http://localhost:3000/admin/page-analyses` (or your production URL)
2. Enter the admin password
3. Click "Access Dashboard"
4. Session persists until you logout or close browser

## 🔒 Best Practices

### For Development
- Keep the default password simple
- Store in `.env.local` (not committed to git)

### For Production
- Use a strong, unique password (20+ characters)
- Store in environment variables on your hosting platform
- Consider implementing proper authentication (OAuth, JWT, etc.)
- Add IP whitelisting if possible
- Enable 2FA for additional security
- Monitor access logs

## 🛡️ Additional Security Recommendations

### Immediate Improvements
1. **Use Environment Variables**
   - Move password to `.env.local`
   - Never commit passwords to git

2. **Add Rate Limiting**
   - Prevent brute force attacks
   - Limit login attempts

3. **Add Logging**
   - Track who accesses the dashboard
   - Monitor deletion activities

### Long-term Improvements
1. **Implement Proper Auth**
   - Use NextAuth.js or similar
   - Add role-based access control
   - Support multiple admin users

2. **Add Audit Trail**
   - Log all admin actions
   - Track who deleted what and when

3. **Add Backup System**
   - Automatic daily backups
   - Restore functionality

## 📝 Privacy Compliance

### User Rights Implemented
- ✅ **Data Access:** Admins can view all stored data
- ✅ **Data Portability:** Export functionality for data transfer
- ✅ **Data Deletion:** Permanent deletion capability
- ✅ **Transparency:** Privacy policy updated with disclosure

### User Rights To Implement (Future)
- ⏳ User-facing deletion request form
- ⏳ Automated data retention policies
- ⏳ User dashboard to view their own data

## 🆘 Troubleshooting

### Forgot Password?
Edit `app/admin/page-analyses/page.tsx` and change the password on line 45.

### Can't Access Dashboard?
1. Clear browser cache and cookies
2. Check if password is correct
3. Verify you're on the correct URL
4. Check browser console for errors

### Delete Not Working?
1. Check Supabase permissions
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. Check browser console for errors
4. Ensure RLS policies allow service role access

## 📧 Support

For security concerns or questions, contact:
- **Email:** security@postready.com
- **Privacy:** privacy@postready.com

