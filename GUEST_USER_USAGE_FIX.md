# Guest User Usage Limits Fix

## Problem Identified

Non-signed-in (guest) users could bypass usage limits by refreshing the page. This allowed unlimited access to Pro-only features:
- **Guide AI** (limited to 2 free uses)
- **Rewrite Caption** (limited to 2 free uses)  
- **Generate Hashtags** (limited to 3 free uses)
- **Regenerate Ideas** (limited usage)
- **Reword Title** (limited usage)

### Root Cause
Only `generateIdeasCount` was being persisted to localStorage for guest users. All other usage counts (`rewriteCount`, `hashtagCount`, `guideAICount`, `regenerateCount`, `rewordTitleCount`) were stored in React state only, which resets on page refresh.

## Solution Implemented

Extended localStorage persistence to **all usage counts** for guest users, not just `generateIdeasCount`.

### Changes Made to `app/page.tsx`

#### 1. Updated Load Logic (Lines 447-527)
- Now loads **all 6 usage counts** from localStorage for guest users
- Uses a single shared timestamp (`postready_usageTimestamp`) for 30-day expiration
- Provides clear console logging for debugging
- Cleans up legacy localStorage keys

```typescript
// Before: Only loaded generateIdeasCount
const storedCount = localStorage.getItem('postready_generateIdeasCount');

// After: Loads all usage counts
const counts = {
  generateIdeas: localStorage.getItem('postready_generateIdeasCount'),
  rewrite: localStorage.getItem('postready_rewriteCount'),
  hashtag: localStorage.getItem('postready_hashtagCount'),
  guideAI: localStorage.getItem('postready_guideAICount'),
  regenerate: localStorage.getItem('postready_regenerateCount'),
  rewordTitle: localStorage.getItem('postready_rewordTitleCount'),
};
```

#### 2. Updated Save Logic (Lines 529-560)
- Now saves **all 6 usage counts** to localStorage for guest users
- Automatically saves whenever any count changes
- Only saves after initial load (prevents overwriting on mount)
- Provides clear console logging for debugging

```typescript
// Before: Only saved generateIdeasCount
localStorage.setItem('postready_generateIdeasCount', generateIdeasCount.toString());

// After: Saves all usage counts
localStorage.setItem('postready_generateIdeasCount', generateIdeasCount.toString());
localStorage.setItem('postready_rewriteCount', rewriteCount.toString());
localStorage.setItem('postready_hashtagCount', hashtagCount.toString());
localStorage.setItem('postready_guideAICount', guideAICount.toString());
localStorage.setItem('postready_regenerateCount', regenerateCount.toString());
localStorage.setItem('postready_rewordTitleCount', rewordTitleCount.toString());
```

## How It Works Now

### Guest Users (Not Signed In)
1. **First Visit**
   - All usage counts start at 0
   - Timestamp is created when first count is saved
   
2. **Using Features**
   - Each time a feature is used, the corresponding count increments
   - Count is immediately saved to localStorage
   - Usage limits are enforced:
     - Guide AI: 2 free uses
     - Rewrite: 2 free uses
     - Hashtags: 3 free uses
     
3. **Page Refresh / Closing Browser**
   - All usage counts are loaded from localStorage
   - User cannot bypass limits by refreshing
   - Upgrade prompt appears when limit is reached
   
4. **Clearing Data**
   - Data expires after 30 days (automatic reset)
   - User can manually clear localStorage (browser settings)
   - Incognito mode starts fresh each time (expected behavior)

### Authenticated Users (Signed In)
- All usage counts saved to Supabase database
- Persists across devices and browsers
- Cannot be bypassed by any means (already working correctly)

## Usage Limits Enforced

| Feature | Free Limit | Code Location | localStorage Key |
|---------|-----------|---------------|------------------|
| Generate More Ideas | 2 uses | Line ~972 | `postready_generateIdeasCount` |
| Rewrite Caption | 2 uses | Line 1597 | `postready_rewriteCount` |
| Generate Hashtags | 3 uses | Line 1519 | `postready_hashtagCount` |
| Guide AI | 2 uses | Line 3688 | `postready_guideAICount` |
| Regenerate Ideas | Limited | - | `postready_regenerateCount` |
| Reword Title | Limited | - | `postready_rewordTitleCount` |

## Testing Instructions

### Test 1: Guest User Cannot Bypass Rewrite Limit
1. Open app in incognito mode (not signed in)
2. Complete the pipeline to reach the caption page
3. Click "Rewrite" button twice (uses both free rewrites)
4. Try to click "Rewrite" again - should see upgrade prompt
5. **Refresh the page**
6. Try to click "Rewrite" again - should still see upgrade prompt ✅
7. Close browser, reopen, navigate back - should still be limited ✅

### Test 2: Guest User Cannot Bypass Guide AI Limit
1. Open app in incognito mode (not signed in)
2. Complete the pipeline to reach the caption page
3. Click "Guide AI" button twice (uses both free uses)
4. Try to click "Guide AI" again - should see upgrade prompt
5. **Refresh the page**
6. Try to click "Guide AI" again - should still see upgrade prompt ✅

### Test 3: Guest User Cannot Bypass Hashtag Limit
1. Open app in incognito mode (not signed in)
2. Complete the pipeline to reach the caption page
3. Click "Generate More Hashtags" three times (uses all 3 free uses)
4. Try to click again - should see upgrade prompt
5. **Refresh the page**
6. Try to click again - should still see upgrade prompt ✅

### Test 4: Usage Persists After Closing Browser
1. Open app in incognito mode (not signed in)
2. Use a feature (e.g., Rewrite twice)
3. Close the browser completely
4. Reopen in incognito mode, navigate back to caption page
5. Try to use Rewrite - should see upgrade prompt ✅

### Test 5: Data Expires After 30 Days (Optional Long-term Test)
1. Use the browser's DevTools Console to manually set an old timestamp:
   ```javascript
   // Set timestamp to 31 days ago
   const thirtyOneDaysAgo = Date.now() - (31 * 24 * 60 * 60 * 1000);
   localStorage.setItem('postready_usageTimestamp', thirtyOneDaysAgo.toString());
   ```
2. Refresh the page
3. All usage counts should reset to 0 ✅

### Test 6: Authenticated Users Unaffected
1. Sign in with a regular (non-Pro) account
2. Use features up to the limit
3. Refresh page - limits should still be enforced ✅
4. Sign out and sign in again - limits should persist ✅

### Test 7: Pro Users Unaffected
1. Sign in with a Pro account
2. Should have unlimited access to all features
3. No usage counts or limits should appear ✅

## Console Logging

When running in development mode, you'll see helpful console messages:

**Guest user loading:**
```
✅ Loaded guest user usage counts from localStorage: {
  generateIdeas: 2,
  rewrite: 2,
  hashtag: 3,
  guideAI: 2,
  regenerate: 0,
  rewordTitle: 0
}
```

**Guest user saving:**
```
💾 Saved guest user usage counts to localStorage: {
  generateIdeas: 2,
  rewrite: 2,
  hashtag: 3,
  guideAI: 2,
  regenerate: 0,
  rewordTitle: 0
}
```

**Data expiration:**
```
⏰ Guest user usage data expired (>30 days), resetting...
```

## Browser DevTools Inspection

You can manually inspect the localStorage in your browser's DevTools:

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Expand "Local Storage" in the sidebar
4. Click on your domain
5. Look for keys starting with `postready_`

**Expected localStorage Keys:**
- `postready_generateIdeasCount` - number
- `postready_rewriteCount` - number
- `postready_hashtagCount` - number
- `postready_guideAICount` - number
- `postready_regenerateCount` - number
- `postready_rewordTitleCount` - number
- `postready_usageTimestamp` - timestamp (milliseconds)

## Important Notes

1. **Incognito Mode**: Each incognito session starts fresh (this is expected browser behavior)
2. **Clear Browser Data**: If users clear their browser data, counts will reset (expected)
3. **30-Day Expiration**: After 30 days, counts automatically reset (prevents indefinite storage)
4. **No Server Needed**: Guest user tracking works entirely in the browser
5. **Privacy-Friendly**: No tracking of guest users on the server side
6. **No Impact on Authenticated Users**: Database tracking for signed-in users unchanged

## Security Considerations

While localStorage can be manually edited by tech-savvy users (using browser DevTools), this is acceptable because:

1. It requires developer knowledge to manipulate
2. The vast majority of users won't attempt this
3. Creating an account is free and provides better experience
4. Server-side validation can be added for critical operations if needed
5. This is a reasonable balance between security and user experience for guest users

## Files Modified

- ✅ `app/page.tsx` - Updated localStorage load/save logic for all usage counts

## Next Steps

1. **Deploy the changes** - No database migration needed (only affects client-side code)
2. **Monitor user behavior** - Check if conversion to Pro increases
3. **Consider additional limits** - Add limits to other features if needed
4. **Server-side validation** - Optionally add server-side checks for critical operations

## Rollback Plan

If issues arise, revert to previous behavior by:
1. Restoring the old useEffect code that only saved/loaded `generateIdeasCount`
2. Or temporarily disable the checks by adding a flag

The changes are isolated to two useEffect hooks, making rollback straightforward.

