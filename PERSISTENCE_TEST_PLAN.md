# Branding System Persistence Test Plan

## Test Overview
This test verifies that uploaded logos, branding names, and profile pictures persist after page reload in mock mode.

## Test Steps

### 1. Initial State Check
- [ ] Open application at http://localhost:5173/
- [ ] Check browser console for any errors
- [ ] Navigate to Settings page
- [ ] Check current branding state

### 2. Test Branding Settings Persistence
- [ ] Go to Settings → Branding tab
- [ ] Upload a logo file
- [ ] Change branding name
- [ ] Save changes
- [ ] Verify changes appear in sidebar immediately
- [ ] Reload page (F5)
- [ ] Check if logo and branding name persist after reload

### 3. Test Profile Settings Persistence  
- [ ] Go to Settings → Profile tab
- [ ] Upload a profile picture
- [ ] Change first name or last name
- [ ] Save changes
- [ ] Verify changes appear in header immediately
- [ ] Reload page (F5)
- [ ] Check if profile picture and name persist after reload

### 4. localStorage Verification
- [ ] Open browser Developer Tools (F12)
- [ ] Go to Application/Storage tab → Local Storage
- [ ] Check for 'mockSettings' key
- [ ] Verify it contains branding and profile data
- [ ] Verify mock:// URLs are stored for images

### 5. Mock URL Display Test
- [ ] Verify mock logos display as blue placeholders with filename
- [ ] Verify mock avatars display as blue circles with initials
- [ ] Check that images load without errors

## Expected Results

✅ **SUCCESS CRITERIA:**
- Uploaded logos persist after page reload
- Branding names persist after page reload  
- Profile pictures persist after page reload
- Profile information persists after page reload
- localStorage contains persistent data
- Mock URLs display correctly as placeholders
- No console errors

❌ **FAILURE INDICATORS:**
- Files disappear after page reload
- Settings revert to defaults after reload
- Console shows localStorage errors
- Mock URLs fail to display
- Runtime errors in console

## Current Status
- ✅ localStorage persistence implemented
- ✅ Mock URL handling implemented  
- ✅ File upload optimization completed
- 🔄 Testing in progress

## Notes
- Mock mode is automatically detected for localhost
- Large files are converted to lightweight mock:// URLs
- Placeholders are generated for mock images
- All settings are stored in localStorage 'mockSettings' key
