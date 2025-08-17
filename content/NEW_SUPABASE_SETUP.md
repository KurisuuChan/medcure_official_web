# 🆕 New Supabase Project Setup Guide

## Step 1: Create New Supabase Project

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Sign In** with your account
3. **Click "New Project"**
4. **Fill in details**:

   - Project Name: `MedCure Pharmacy`
   - Organization: Choose your organization
   - Database Password: Create a strong password
   - Region: Choose closest to your location

5. **Wait for project creation** (takes 2-3 minutes)

## Step 2: Get New Credentials

Once your project is created:

1. **Go to Settings → API**
2. **Copy the new values**:
   - Project URL (looks like: `https://[project-ref].supabase.co`)
   - Anon/Public Key (starts with `eyJhbGci...`)

## Step 3: Update Environment File

Replace your current `.env` with:

```env
# New Supabase Configuration
VITE_SUPABASE_URL=https://[your-new-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-new-anon-key]
VITE_USE_MOCK_API=false
```

## Step 4: Set Up Database

1. **Go to SQL Editor** in Supabase
2. **Copy content from** `database/schema.sql`
3. **Run the SQL** to create all tables
4. **Copy content from** `database/storage-setup.sql`
5. **Run the SQL** to create storage buckets

## Step 5: Test Connection

1. **Restart your dev server**: `npm run dev`
2. **Check Backend Status**: Go to Settings → Backend Status
3. **Should show**: "System Status: Healthy" (green)

---

## Alternative: Continue with Mock Mode

If you prefer to continue with mock mode for now:

```env
VITE_USE_MOCK_API=true
```

This will:

- ✅ Stop DNS resolution attempts
- ✅ Use localStorage for all data
- ✅ Work perfectly for development
- ✅ No backend setup required

---

The choice is yours! Mock mode works perfectly for development, but a real backend gives you production capabilities.
