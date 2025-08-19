# MedCure Settings System Setup Guide

## Overview

The MedCure settings system now supports both localStorage (for demo/offline use) and Supabase database (for persistent cloud storage). This provides a hybrid approach that works in all environments.

## Features Implemented

### 1. Persistent Settings Storage

- **User Profiles**: Name, avatar, phone, address
- **Business Settings**: Name, logo, branding, contact info
- **App Settings**: Theme, currency, notifications, preferences

### 2. Dual Storage System

- **Primary**: Supabase PostgreSQL database with RLS
- **Fallback**: localStorage for offline/demo mode
- **Auto-sync**: Changes sync to both storage methods

### 3. Real-time Updates

- Settings changes trigger events to update Header/Sidebar
- Components load initial settings from localStorage on mount
- Seamless experience across page reloads

## Database Setup

### Step 1: Run the Settings Migration

Execute the SQL file to create the required tables:

```sql
-- Run this in your Supabase SQL editor
-- File: content/settings-tables.sql
```

This creates:

- `user_profiles` table
- `business_settings` table
- `app_settings` table
- `avatars` and `business-assets` storage buckets
- Row Level Security policies
- Auto-update triggers

### Step 2: Configure Storage Buckets

The migration automatically creates storage buckets, but verify they exist:

1. Go to Supabase Dashboard → Storage
2. Ensure these buckets exist:
   - `avatars` (public, for profile pictures)
   - `business-assets` (public, for logos)

### Step 3: Test Authentication Flow

The system gracefully handles both scenarios:

**With Authentication:**

- Settings save to Supabase database
- Files upload to Supabase Storage
- localStorage acts as cache

**Without Authentication (Demo Mode):**

- Settings save to localStorage only
- Files use local blob URLs
- Full functionality maintained

## How It Works

### Settings Persistence

1. **Page Load**: Components load settings from localStorage immediately
2. **Settings Change**: Updates save to both Supabase and localStorage
3. **Page Reload**: Settings persist via localStorage cache
4. **Real-time**: Events update Header/Sidebar instantly

### File Upload Flow

1. **With Auth**: Upload to Supabase Storage → Get public URL
2. **Without Auth**: Create local blob URL
3. **Fallback**: If Supabase fails, use local URL
4. **Storage**: URL saved to settings (both locations)

### Error Handling

- Supabase connection failures fall back to localStorage
- Corrupted localStorage data gets cleaned automatically
- Missing settings get default values
- All operations have try/catch protection

## Benefits

### 1. Works Everywhere

- ✅ Production with Supabase authentication
- ✅ Development without authentication
- ✅ Offline mode
- ✅ Demo environments

### 2. Persistent Across Reloads

- ✅ Profile pictures remain after reload
- ✅ Business logos persist
- ✅ All settings maintain state
- ✅ No loss of customization

### 3. Scalable Architecture

- ✅ Database-backed for production
- ✅ Real-time updates
- ✅ Proper data relationships
- ✅ Security with RLS

## Implementation Status

### ✅ Completed

- [x] Settings service with dual storage
- [x] Database schema and migrations
- [x] File upload with fallback
- [x] Real-time event system
- [x] Header/Sidebar persistence
- [x] Error handling and recovery

### 📋 Usage Instructions

1. **For Development**:

   - Settings work immediately via localStorage
   - No setup required for basic functionality

2. **For Production**:

   - Run the migration SQL file
   - Enable Supabase authentication
   - Configure storage buckets
   - Settings will persist in database

3. **Testing**:
   - Change profile picture → Should persist after reload
   - Update business name → Should update sidebar immediately
   - Modify settings → Should save to both localStorage and database

The system is now fully functional and will resolve the "settings reset on reload" issue!
