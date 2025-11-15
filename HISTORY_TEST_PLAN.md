# History Feature - Test Plan

## Overview
This document outlines the testing procedure to verify that posts are correctly saved to History when captions are generated and that the History page displays saved posts properly.

## Prerequisites
- Application is running locally or deployed
- Supabase database is configured with the `post_history` table
- User authentication is working

## Test Scenarios

### Test 1: Basic Post Creation and History Save
**Objective**: Verify that a post is saved to history when captions are generated

**Steps**:
1. Open the application
2. Sign in with a test account
3. Enter business information:
   - Business Name: "Test Coffee Shop"
   - Business Type: "Cafe / Bakery"
   - Location: "Seattle, WA"
   - Platform: "Instagram"
4. Click "Research My Business"
5. Wait for research to complete
6. Review the strategy and click "Next: Choose Your Video Idea"
7. Select any video idea
8. Click "Next: Record Video"
9. Click "I'm Done Recording!"
10. Wait for caption generation (6 seconds loading screen)
11. Verify you reach the "Your Post is Ready!" page

**Expected Results**:
- ✅ Post details are displayed (title, caption, hashtags, best posting time)
- ✅ Console log shows: "📝 Post-details step reached - ensuring post is saved to history"
- ✅ Console log shows: "✅ Post saved to history successfully"

### Test 2: View History Page
**Objective**: Verify that saved posts appear on the History page

**Steps**:
1. From the "Your Post is Ready!" page
2. Click "History" in the top navigation
3. Observe the History page

**Expected Results**:
- ✅ History page loads
- ✅ Console log shows: "📂 Loading history data for user: [user-id]"
- ✅ The post created in Test 1 is visible
- ✅ Post displays:
  - Video idea title
  - Business name
  - Completion date
  - Content angle badge
  - Full caption with hashtags
  - Post title
  - Best posting time
  - "Copy Caption" button

### Test 3: Multiple Posts
**Objective**: Verify that multiple posts are saved and displayed

**Steps**:
1. Click "Home" to return to the main page
2. Create another post with different business info or video idea
3. Complete the full workflow
4. Navigate to History page

**Expected Results**:
- ✅ Both posts are visible in the History page
- ✅ Posts are ordered by completion date (newest first)
- ✅ Each post displays correctly with all information

### Test 4: History Persistence
**Objective**: Verify that history persists across sessions

**Steps**:
1. Navigate to History page and note the posts
2. Refresh the page (F5)
3. Sign in again if needed
4. Navigate to History page

**Expected Results**:
- ✅ All previously created posts are still visible
- ✅ No duplicate posts appear
- ✅ Post data is accurate

### Test 5: Copy Caption Functionality
**Objective**: Verify that the copy caption button works

**Steps**:
1. Navigate to History page
2. Click "Copy Caption" on any post
3. Paste into a text editor

**Expected Results**:
- ✅ Success notification appears: "Caption copied to clipboard!"
- ✅ Pasted text matches the caption displayed in the History

### Test 6: Navigation from Portal
**Objective**: Verify that History can be accessed from the User Portal

**Steps**:
1. Click your email address in the top navigation
2. Click "Post History" in the portal
3. Verify you're redirected to the History page

**Expected Results**:
- ✅ History page loads
- ✅ All saved posts are visible
- ✅ URL parameter is cleared after navigation

### Test 7: Empty History State
**Objective**: Verify the empty state displays correctly for new users

**Steps**:
1. Create a new test account
2. Sign in
3. Navigate to History page (without creating any posts)

**Expected Results**:
- ✅ Empty state displays with:
  - 📭 emoji
  - "No posts yet" heading
  - "Complete the full PostReady workflow to see your posts here" message
  - "Create Your First Post" button

### Test 8: Duplicate Prevention
**Objective**: Verify that duplicate posts are not created

**Steps**:
1. Create a post and complete the workflow
2. Check the browser console for duplicate save logs
3. Navigate to History page
4. Count the number of posts

**Expected Results**:
- ✅ Console shows: "📝 Post already saved recently, skipping duplicate save" (if duplicate save is attempted)
- ✅ Only ONE instance of the post appears in History
- ✅ No duplicate entries

### Test 9: Error Handling
**Objective**: Verify that posts are saved even if caption generation has issues

**Steps**:
1. Simulate a slow network or API timeout
2. Complete the workflow
3. Check if post is still saved when reaching post-details step

**Expected Results**:
- ✅ Even if caption generation fails, post is saved when post-details step is reached
- ✅ Fallback caption is used
- ✅ Post appears in History

### Test 10: Anonymous User Behavior
**Objective**: Verify that anonymous users cannot save/view history

**Steps**:
1. Sign out
2. Try to access History page

**Expected Results**:
- ✅ History page shows empty state or prompts to sign in
- ✅ No posts are visible (even if user created posts before signing out)
- ✅ No errors in console

## Console Logs to Monitor

During testing, watch for these console logs:

### Successful Save:
```
💾 Saving completed post to history: [video-idea-title]
✅ Post saved to history successfully
✅ Reloaded post history: [count] posts
```

### Duplicate Prevention:
```
📝 Post already saved recently, skipping duplicate save
```

### History Loading:
```
📂 Loading history data for user: [user-id]
✅ Setting completed posts: [count] posts
```

### Post-Details Step:
```
📝 Post-details step reached - ensuring post is saved to history
```

## Known Issues to Watch For

1. **Duplicate Saves**: If you see multiple identical posts in History, the duplicate prevention is not working
2. **Empty History**: If History shows "No posts yet" after creating posts, check:
   - User authentication status
   - Supabase connection
   - Console errors
3. **Stale Data**: If History doesn't update after creating new posts, the reload mechanism is not working

## Success Criteria

All tests pass with:
- ✅ Posts are saved when captions are generated
- ✅ Posts appear immediately in History after creation
- ✅ No duplicate posts
- ✅ History persists across sessions
- ✅ All UI elements display correctly
- ✅ Copy functionality works
- ✅ Empty state displays for new users
- ✅ No console errors

## Regression Testing

After making changes, re-run all tests to ensure:
- Existing functionality still works
- No new bugs introduced
- Performance is acceptable


















