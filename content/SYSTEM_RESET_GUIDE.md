# 🔄 MedCure System Reset Guide

## Overview

Your MedCure system now has comprehensive reset functionality to give you a fresh start with no data. This is perfect for development, testing, or when you need to clean slate.

## 🎯 Reset Options Available

### 1. **Quick Reset (Recommended for Development)**

- **What it does**: Clears browser storage and resets UI settings
- **What it keeps**: Database data intact
- **Use case**: Perfect for development when you want to reset UI state

**How to use:**

- Browser Console: `MedCureReset.quickReset()`
- System Reset Page: Click "Quick Reset" button

### 2. **Clear Storage Only**

- **What it does**: Only removes browser localStorage and sessionStorage
- **What it keeps**: Everything else (database, settings)
- **Use case**: Just clear cache and saved preferences

**How to use:**

- Browser Console: `MedCureReset.clearStorage()`
- System Reset Page: Click "Clear Storage" button

### 3. **Complete Reset (Nuclear Option)**

- **What it does**: ⚠️ Removes ALL data including database records
- **What it keeps**: Nothing - completely fresh system
- **Use case**: Start completely over, testing from scratch

**How to use:**

- Browser Console: `MedCureReset.fullReset()` (requires confirmation)
- System Reset Page: Click "Complete Reset" (requires confirmation)

### 4. **Reset + Demo Data**

- **What it does**: Complete reset + creates sample data
- **What it creates**: Demo products, admin user, sample transactions
- **Use case**: Testing, demonstrations, tutorials

**How to use:**

- Browser Console: `MedCureReset.resetWithDemo()` (requires confirmation)
- System Reset Page: Click "Reset + Demo Data" (requires confirmation)

## 🖥️ Access Methods

### Method 1: System Reset Page (GUI)

1. Go to **Settings** → **Backup & Data** tab
2. Click **"Open System Reset Tool"** button
3. Choose your reset option
4. Follow the prompts

**Direct URL:** `http://localhost:5173/system-reset`

### Method 2: Browser Console (Quick)

1. Open browser console (F12 → Console tab)
2. Type one of these commands:

```javascript
// Quick development reset
MedCureReset.quickReset();

// Clear storage only
MedCureReset.clearStorage();

// Complete reset (asks for confirmation)
MedCureReset.fullReset();

// Reset with demo data (asks for confirmation)
MedCureReset.resetWithDemo();

// Show all available commands
MedCureReset.help();
```

### Method 3: Settings Page Link

- Go to **Settings** → **Backup & Data** tab
- Find the "System Reset" section
- Click the button to open reset tools

## ⚠️ Important Warnings

### Before Complete Reset:

- **Backup Important Data**: Complete resets delete everything permanently
- **Cannot Be Undone**: There's no undo button for complete resets
- **Confirmation Required**: Complete resets require explicit confirmation

### What Gets Cleared:

**Storage Reset:**

- ✅ User sessions and login state
- ✅ Saved preferences and settings
- ✅ Search history and recent items
- ✅ Shopping cart and draft transactions
- ✅ UI state and filters
- ❌ Database data (kept intact)

**Complete Reset:**

- ✅ All of the above PLUS:
- ✅ Products and inventory
- ✅ Sales transactions
- ✅ Customer/patient records
- ✅ User accounts
- ✅ All system settings
- ✅ Notifications and history

## 🚀 Quick Start Examples

### For Development:

```javascript
// Most common - reset UI but keep data
MedCureReset.quickReset();
```

### For Testing:

```javascript
// Fresh start with sample data
MedCureReset.resetWithDemo();
```

### For Clean Slate:

```javascript
// Nuclear option - everything gone
MedCureReset.fullReset();
```

## 🔧 Technical Details

### Files Created:

- `src/utils/systemReset.js` - Core reset functionality
- `src/utils/consoleReset.js` - Browser console commands
- `src/pages/SystemReset.jsx` - GUI reset interface

### Backend Integration:

- **Mock Mode**: Resets only browser storage and mock data
- **Backend Mode**: Can reset actual Supabase database tables
- **Safe Fallbacks**: Graceful handling when backend unavailable

### Database Reset (Backend Mode):

Clears these tables in order:

1. `sales_transaction_items`
2. `sales_transactions`
3. `inventory_movements`
4. `products`
5. `contacts`
6. `users`
7. `notifications`
8. `settings`

## 📋 After Reset Checklist

1. **Refresh the Page** - Always refresh after any reset
2. **Check Console** - Look for success/error messages
3. **Verify Reset** - Confirm the data state matches expectations
4. **Reconfigure** - Set up any needed initial settings

## 🛠️ Troubleshooting

### Console Commands Not Working:

- Make sure you're on the MedCure site
- Try refreshing the page first
- Check console for error messages

### Reset Not Complete:

- Hard refresh the page (Ctrl+F5)
- Clear browser cache manually
- Check if backend is running (for database resets)

### Demo Data Not Created:

- Ensure backend is connected
- Check database permissions
- Verify Supabase configuration

---

**Remember**: Always use the appropriate reset level for your needs. Start with `quickReset()` for most development scenarios! 🎯
