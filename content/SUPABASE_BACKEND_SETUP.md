# 🔧 Supabase Backend Setup Guide for Branding System

## Issue Diagnosis

The uploaded profile pictures and logos are not displaying because:

1. The app was running in mock mode (`VITE_USE_MOCK_API=true`)
2. Supabase storage buckets for images were not configured
3. Images were being stored in localStorage instead of Supabase

## ✅ Solution Steps

### Step 1: Environment Configuration

**Status: ✅ COMPLETED**

- Changed `.env` file from `VITE_USE_MOCK_API=true` to `VITE_USE_MOCK_API=false`
- Server automatically restarted to pick up new settings

### Step 2: Supabase Storage Setup

**Status: ⚠️ REQUIRED - Please follow these steps:**

1. **Open your Supabase Dashboard:**

   - Go to https://supabase.com/dashboard
   - Select your project: `smgmuwddxwqjtstqmorl`

2. **Create Storage Buckets:**

   - Go to "Storage" in the left sidebar
   - Click "Create bucket"
   - Create these buckets:

   **Logos Bucket:**

   - Name: `logos`
   - Public: ✅ Yes
   - File size limit: `5MB`
   - Allowed file types: `image/jpeg, image/png, image/gif, image/webp`

   **Avatars Bucket:**

   - Name: `avatars`
   - Public: ✅ Yes
   - File size limit: `2MB`
   - Allowed file types: `image/jpeg, image/png, image/gif, image/webp`

3. **Run SQL Setup (Alternative Method):**
   - Go to "SQL Editor" in Supabase
   - Copy and paste the contents of `database/supabase_storage_setup.sql`
   - Run the SQL commands

### Step 3: Test Backend Connection

**Status: 🔄 IN PROGRESS**

1. **Check Backend Status:**

   - Open the app at http://localhost:5173/
   - Go to Settings → Backend Status
   - Should show "System Status: Healthy" with green indicators

2. **Test Image Upload:**
   - Go to Settings → Branding
   - Upload a logo image
   - Go to Settings → Profile
   - Upload a profile picture
   - Images should now persist after page reload

## 🚨 Current Status

### Environment Variables

```
VITE_SUPABASE_URL=https://smgmuwddxwqjtstqmorl.supabase.co ✅
VITE_SUPABASE_ANON_KEY=your_key ✅
VITE_USE_MOCK_API=false ✅
```

### Required Supabase Setup

- ⚠️ **Storage buckets need to be created**
- ⚠️ **Storage policies need to be configured**
- ✅ Settings table already exists
- ✅ Database schema is ready

## 🎯 Next Steps

1. **Immediate (Required):**

   - Create storage buckets in Supabase dashboard
   - OR run the SQL setup script

2. **Testing:**

   - Upload logo and profile picture
   - Verify they persist after page reload
   - Check that images display correctly

3. **Verification:**
   - Backend Status page should show all green
   - Settings should save to Supabase database
   - Images should be stored in Supabase storage

## 📋 Expected Results After Setup

### Before Fix:

- ❌ Images disappear after reload
- ❌ Running in mock mode
- ❌ Data stored in localStorage only

### After Fix:

- ✅ Images persist permanently
- ✅ Running in backend mode
- ✅ Data stored in Supabase database
- ✅ Images stored in Supabase storage
- ✅ Real-time updates work correctly

## 🔍 Troubleshooting

### If backend status shows errors:

1. Check Supabase project is active
2. Verify environment variables are correct
3. Ensure storage buckets are created
4. Check internet connection

### If images still don't upload:

1. Verify storage buckets exist
2. Check file size limits (5MB logos, 2MB avatars)
3. Ensure file types are allowed
4. Check browser console for errors

## 📞 Need Help?

If you encounter issues:

1. Check the Backend Status page in Settings
2. Look at browser console for error messages
3. Verify Supabase dashboard shows storage buckets
4. Confirm database tables exist in Supabase

The system is now configured to use the real Supabase backend - you just need to create the storage buckets for image uploads to work properly!
