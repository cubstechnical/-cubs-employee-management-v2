# Production Fixes - Domain & Upload Issues

## Issues Fixed

### 1. **API Routes Not Working in Production**
**Problem:** API routes were using relative paths (`/api/...`) which don't work correctly in production when the domain changes or when using Capacitor mobile apps.

**Solution:** 
- Created `lib/utils/apiClient.ts` with `getApiUrl()` function that:
  - Uses absolute URLs in production based on `NEXT_PUBLIC_APP_URL`
  - Uses relative paths in development (works with Next.js dev server)
  - Automatically detects Capacitor environment and uses the correct base URL
  - Falls back to `window.location.origin` if environment variable is not set

**Files Updated:**
- `lib/utils/apiClient.ts` (new file)
- `lib/utils/environment.ts` (added `getApiBaseUrl()` function)
- `lib/services/documents.ts` (upload API call)
- `lib/services/backblaze.ts` (fallback upload API call)
- `components/dashboard/Settings.tsx` (settings API calls)
- `components/documents/DocumentPreview.tsx` (preview API call)
- `components/layout/AppErrorBoundary.tsx` (error reporting API call)
- `app/notifications/page.tsx` (email API call)

### 2. **Capacitor Configuration**
**Problem:** Capacitor config had hardcoded URL that might not match the actual production domain.

**Solution:**
- Updated `capacitor.config.ts` with clear comments about updating the URL
- The URL is now clearly documented and easy to update if domain changes
- Mobile apps will use the configured server URL for API calls via `getApiBaseUrl()`

### 3. **Environment Variables**
**Important:** Ensure these environment variables are set in Vercel:

**Required:**
- `NEXT_PUBLIC_APP_URL` - Should be set to `https://cubsgroups.com` (or your actual domain)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `B2_APPLICATION_KEY_ID` - Backblaze B2 key ID
- `B2_APPLICATION_KEY` - Backblaze B2 application key
- `B2_BUCKET_NAME` - Backblaze B2 bucket name

**Optional but Recommended:**
- `B2_ENDPOINT` - Backblaze B2 endpoint (defaults to `https://s3.us-east-005.backblazeb2.com`)
- `B2_BUCKET_ID` - Backblaze B2 bucket ID

## How It Works Now

### Development
- API calls use relative paths (`/api/...`)
- Works seamlessly with Next.js dev server
- No configuration needed

### Production (Web)
- API calls use absolute URLs (`https://cubsgroups.com/api/...`)
- Based on `NEXT_PUBLIC_APP_URL` environment variable
- Falls back to current origin if env var not set

### Production (Mobile/Capacitor)
- API calls detect Capacitor environment
- Use the configured server URL from Capacitor config
- Falls back to current origin if needed

## Testing Checklist

1. **Web Production:**
   - [ ] Verify `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
   - [ ] Test document upload in production
   - [ ] Test settings save/load
   - [ ] Test email sending
   - [ ] Check browser console for any API errors

2. **Mobile App:**
   - [ ] Verify Capacitor config has correct production URL
   - [ ] Test document upload in mobile app
   - [ ] Test all API-dependent features
   - [ ] Check for network errors in mobile console

3. **Domain Configuration:**
   - [ ] Ensure domain nameservers point to Vercel
   - [ ] Verify SSL certificate is valid
   - [ ] Test that `https://cubsgroups.com` loads correctly
   - [ ] Check that API routes are accessible at `https://cubsgroups.com/api/...`

## Troubleshooting

### Upload Still Not Working in Production

1. **Check Environment Variables:**
   ```bash
   # In Vercel dashboard, verify:
   NEXT_PUBLIC_APP_URL=https://cubsgroups.com
   B2_APPLICATION_KEY_ID=...
   B2_APPLICATION_KEY=...
   B2_BUCKET_NAME=...
   ```

2. **Check API Route Logs:**
   - Go to Vercel dashboard → Your project → Functions
   - Check logs for `/api/documents/upload` route
   - Look for errors related to Backblaze credentials or network issues

3. **Test API Route Directly:**
   ```bash
   curl -X POST https://cubsgroups.com/api/documents/upload \
     -F "file=@test.pdf" \
     -F "employee_id=TEST123" \
     -F "document_type=other" \
     -F "file_name=test.pdf" \
     -F "file_size=1000" \
     -F "file_path=test/test.pdf" \
     -F "file_type=application/pdf"
   ```

4. **Check Domain DNS:**
   - Verify nameservers point to Vercel
   - Check DNS propagation: `dig cubsgroups.com`
   - Ensure no "parked" page is showing

### Mobile App Issues

1. **Update Capacitor Config:**
   - Edit `capacitor.config.ts`
   - Update `server.url` to match your production domain
   - Run `npx cap sync` to apply changes

2. **Rebuild Mobile App:**
   ```bash
   npm run build
   npx cap sync
   # Then rebuild in Xcode/Android Studio
   ```

## Next Steps

1. Deploy to Vercel with updated code
2. Verify environment variables are set correctly
3. Test upload functionality in production
4. Update mobile apps if needed
5. Monitor Vercel function logs for any errors

