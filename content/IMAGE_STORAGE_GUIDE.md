# 📁 MedCure Image Storage Locations Guide

## 🗂️ **Where Your Images Are Stored**

### **1. Supabase Storage (When Working)**

#### **Profile Pictures** 🖼️

- **Bucket**: `avatars`
- **Path Structure**: `{user_id}/avatar-{timestamp}.{extension}`
- **Example Path**: `11111111-1111-1111-1111-111111111111/avatar-1692789123456.jpg`
- **Full URL**: `https://your-project.supabase.co/storage/v1/object/public/avatars/11111111-1111-1111-1111-111111111111/avatar-1692789123456.jpg`

#### **Business Logos** 🏢

- **Bucket**: `business-assets`
- **Path Structure**: `business/logo-{timestamp}.{extension}`
- **Example Path**: `business/logo-1692789123456.png`
- **Full URL**: `https://your-project.supabase.co/storage/v1/object/public/business-assets/business/logo-1692789123456.png`

#### **Debug Service Uploads** 🧪

- **Profile Pictures**: `avatars/profiles/{timestamp}-{randomId}.{extension}`
- **Business Logos**: `business-assets/logos/{timestamp}-{randomId}.{extension}`
- **Test Files**: `avatars/test/{timestamp}-{randomId}.txt`

### **2. localStorage (Fallback Storage)**

When Supabase upload fails, images are stored as **Base64** data URLs in browser localStorage:

#### **Profile Pictures**

- **Key**: `medcure_user_profile`
- **Field**: `avatar_url`
- **Format**: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...`

#### **Business Logos**

- **Key**: `medcure_business_settings`
- **Field**: `logo_url`
- **Format**: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...`

### **3. Storage Location Priority**

Your app tries storage in this order:

1. **Supabase Storage** (if user authenticated and storage accessible)
2. **localStorage Base64** (fallback when Supabase fails)
3. **Default/Empty** (if both fail)

---

## 🔍 **How to Find Your Images**

### **Method 1: Check Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Look for these buckets:
   - `avatars` - Contains profile pictures
   - `business-assets` - Contains business logos
4. Browse folder structure to find your files

### **Method 2: Check Browser localStorage**

1. Open **Developer Tools** (F12)
2. Go to **Application** tab
3. Expand **Local Storage** → `http://localhost:5173` (or your domain)
4. Look for these keys:
   - `medcure_user_profile` - Contains profile data with avatar_url
   - `medcure_business_settings` - Contains business data with logo_url

### **Method 3: Use Debug Tools**

1. Go to **Settings** → **Storage Debug** tab
2. Click **"List Files"** to see all uploaded files
3. Click **"Run Storage Diagnostics"** for detailed storage info

### **Method 4: Check Console Logs**

When uploading, your console shows:

```
🚀 Starting upload to avatars/profiles...
📁 Upload path: profiles/1692789123456-abc123.jpg
✅ Upload successful
✅ Public URL generated: https://[project].supabase.co/storage/v1/object/public/avatars/profiles/1692789123456-abc123.jpg
```

---

## 🌐 **Public URLs**

### **Supabase Storage URLs**

- **Format**: `https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[path]`
- **Profile**: `https://[project-id].supabase.co/storage/v1/object/public/avatars/[user-id]/avatar-[timestamp].[ext]`
- **Logo**: `https://[project-id].supabase.co/storage/v1/object/public/business-assets/business/logo-[timestamp].[ext]`

### **localStorage URLs**

- **Format**: `data:[mime-type];base64,[encoded-data]`
- **Example**: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...`

---

## 📂 **Storage Structure Visualization**

```
Supabase Storage
├── avatars/ (bucket)
│   ├── [user-id-1]/
│   │   ├── avatar-1692789123456.jpg
│   │   └── avatar-1692789987654.png
│   ├── [user-id-2]/
│   │   └── avatar-1692790000000.jpg
│   ├── profiles/ (debug uploads)
│   │   ├── 1692789123456-abc123.jpg
│   │   └── 1692789987654-def456.png
│   └── test/ (test uploads)
│       └── 1692789123456-abc123.txt
│
└── business-assets/ (bucket)
    ├── business/
    │   ├── logo-1692789123456.png
    │   └── logo-1692789987654.jpg
    └── logos/ (debug uploads)
        ├── 1692789123456-abc123.png
        └── 1692789987654-def456.jpg

Browser localStorage
├── medcure_user_profile
│   └── avatar_url: "data:image/jpeg;base64,..."
├── medcure_business_settings
│   └── logo_url: "data:image/png;base64,..."
└── medcure_app_settings
    └── [app preferences]
```

---

## 🔧 **How to Access Your Images**

### **Direct URL Access**

If stored in Supabase, you can access images directly via URL:

```
https://your-project.supabase.co/storage/v1/object/public/avatars/your-file-path
```

### **Download from localStorage**

If stored as Base64:

1. Copy the Base64 data from localStorage
2. Paste into a new browser tab
3. The image will display
4. Right-click → Save As to download

### **Using the Debug Tool**

1. Open Settings → Storage Debug
2. Upload a test image
3. Check console for the exact storage path and URL
4. Use that pattern to find your other images

---

## 🚨 **Common Issues**

**Images not appearing after page refresh:**

- Check if they're in localStorage (Base64) vs Supabase
- Base64 images should persist across reloads
- Missing images = upload likely failed

**Can't find images in Supabase:**

- Check if upload actually succeeded (console logs)
- Verify bucket names and folder structure
- Check storage policies and permissions

**Images too large:**

- Check browser Network tab for upload failures
- Verify file size limits in storage policies
- Large Base64 can exceed localStorage limits

Your images are most likely stored in **browser localStorage as Base64** if Supabase uploads are failing!
