# Local Setup & Testing Guide

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React 18
- Vite (build tool)
- Supabase client
- Tailwind CSS
- And all UI components

**Expected output:**
```
added 430 packages, and audited 431 packages in 56s
```

## Step 2: Start Development Server

### Option A: Using npm (Recommended)
```bash
npm run dev
```

### Option B: Using PowerShell (Windows)
```powershell
npm run dev
```

**Expected output:**
```
  VITE v5.4.1  ready in 234 ms

  ➜  Local:   http://localhost:8080/
  ➜  press h to show help
```

## Step 3: Access the Application

1. Open your browser
2. Go to: **http://localhost:8080**
3. You should see the login page

## Step 4: Login

Use your credentials:
- **Email:** Your registered email
- **Password:** Your password

## Step 5: Navigate to RTNE

1. Click on **"Run RTNE"** button in the navbar
2. Or go directly to: **http://localhost:8080/rtne**

## Step 6: Test the New Features

### Test 1: Full Name + Company Enrichment
```
1. Enter "John Smith" in Full Name column
2. Enter "Acme Corporation" in Company Name column
3. Watch for "Enriching..." status
4. Phone and Email should auto-fill
```

### Test 2: LinkedIn URL Enrichment
```
1. Paste a LinkedIn profile URL in LinkedIn Profile URL column
2. Watch for "Enriching..." status
3. Phone and Email should auto-fill
```

### Test 3: Column Editing
```
1. Click on any cell to edit
2. Type your data
3. Press Tab to move to next cell
4. Press Enter to move down
5. Data should save automatically after 1 second
```

## Troubleshooting

### Port Already in Use
If port 8080 is already in use:

```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID [PID] /F

# Restart dev server
npm run dev
```

### Changes Not Showing
1. **Hard Refresh:** `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. **Clear Cache:** Open DevTools (F12) → Right-click refresh → "Empty Cache and Hard Reload"
3. **Restart Server:** Stop (Ctrl+C) and run `npm run dev` again

### Supabase Connection Error
1. Check internet connection
2. Verify Supabase credentials in `src/integrations/supabase/client.ts`
3. Check browser console (F12) for detailed error messages

### Enrichment Not Working
1. Check browser console (F12) for errors
2. Verify Lusha API keys are configured
3. Ensure both Full Name and Company Name are filled
4. Check network tab to see API requests

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm build

# Preview production build
npm preview

# Run linter
npm lint

# Build for development
npm run build:dev
```

## File Structure

```
src/
├── pages/
│   └── Rtne.tsx              # Main RTNE page (MODIFIED)
├── services/
│   └── lushaService.ts       # Lusha API integration
├── components/
│   └── RowContextMenu.tsx    # Context menu for rows
├── integrations/
│   └── supabase/
│       └── client.ts         # Supabase configuration
└── utils/
    └── linkedInUtils.ts      # LinkedIn URL validation
```

## Key Features Implemented

✅ **Smart Search Logic**
- Condition A: LinkedIn URL enrichment
- Condition B: Name + Company enrichment

✅ **Name Splitting**
- Automatically splits full names into first/last
- Handles single-word names

✅ **Auto-Enrichment**
- Phone number lookup
- Email address lookup
- Real-time status updates

✅ **Column Reordering**
- Full Name → Company Name → LinkedIn URL
- All columns are editable

✅ **Data Persistence**
- Auto-saves to Supabase after 1 second
- Prevents duplicate enrichment

## Browser DevTools Tips

### View Network Requests
1. Press `F12` to open DevTools
2. Go to **Network** tab
3. Perform an action (e.g., fill in Full Name + Company)
4. Look for API calls to `lusha-enrich` function

### View Console Logs
1. Press `F12` to open DevTools
2. Go to **Console** tab
3. Look for enrichment status messages
4. Check for any error messages

### View Application State
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Check **Local Storage** for saved data
4. Check **Cookies** for session info

## Performance Tips

1. **Use Chrome DevTools** for best debugging experience
2. **Hard refresh** after code changes to clear cache
3. **Check console** for errors before reporting issues
4. **Use incognito mode** to test without cache interference

## Next Steps

1. ✅ Install dependencies
2. ✅ Start dev server
3. ✅ Test Full Name + Company enrichment
4. ✅ Test LinkedIn URL enrichment
5. ✅ Verify data persistence
6. ✅ Check column order and editability

## Support

If you encounter issues:
1. Check the browser console (F12)
2. Review error messages
3. Try hard refresh (Ctrl+Shift+R)
4. Restart the dev server
5. Check network connectivity

Happy testing! 🚀
