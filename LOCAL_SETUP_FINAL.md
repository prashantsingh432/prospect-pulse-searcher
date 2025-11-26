# Local Setup & Testing Guide - Final Version

**Date:** November 25, 2025  
**Status:** ✅ READY FOR LOCAL TESTING  
**Version:** 5.1.0

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Supabase Locally
```bash
supabase start
```

This will:
- Start PostgreSQL database
- Start Supabase services
- Output connection details

### 3. Deploy Edge Function
```bash
supabase functions deploy lusha-enrich-proxy
```

### 4. Start Development Server
```bash
npm run dev
```

The app will be available at: **http://localhost:8080**

---

## 🔧 How the Smart Search Works Locally

### The Flow (Python-Mirror Logic)

```
User fills: Full Name = "Swadhin Jamkar", Company = "Bajaj Finserv"
    ↓
Frontend splits name:
  firstName = "Swadhin"
  lastName = "Jamkar"
    ↓
Calls enrichProspectByName(fullName, companyName, "PHONE_ONLY")
    ↓
Service fetches FRESH list of active PHONE_ONLY keys from Supabase
    ↓
Loop through keys (re-fetches on each iteration):
  ├─ Try Key 1
  │  ├─ 429 (Out of Credits) → Mark EXHAUSTED, continue to Key 2
  │  ├─ 401 (Invalid) → Mark INVALID, continue to Key 2
  │  ├─ 200 (Success) → Parse data, return result
  │  └─ 404 (Not Found) → Return null (don't retry)
  │
  ├─ Try Key 2
  │  └─ 200 (Success) → Parse data, return result
  │
  └─ Try Key 3, 4, 5...
    ↓
Frontend updates spreadsheet with phone number
    ↓
Toast: "Phone Enrichment Complete: 1 found, 0 failed"
```

### CORS Proxy (Critical for Localhost)

The Edge Function now uses **corsproxy.io** to bypass CORS restrictions:

```
Browser → Supabase Edge Function → CORS Proxy → Lusha API
```

This allows the app to work on localhost without CORS errors.

---

## 📝 Testing Checklist

### Test 1: Basic Name + Company Enrichment
1. Open http://localhost:8080
2. Login with your credentials
3. Go to RTNE page
4. Fill in:
   - Full Name: "Swadhin Jamkar"
   - Company: "Bajaj Finserv"
5. Click "Enrich Phones"
6. Check console (F12) for logs
7. Verify phone appears in spreadsheet

**Expected Result:**
```
✅ Phone Enrichment Complete: 1 found, 0 failed
Phone Column: Shows phone number
```

### Test 2: Single Word Name
1. Fill in:
   - Full Name: "Cher"
   - Company: "Sony Music"
2. Click "Enrich Phones"
3. Check console logs

**Expected Result:**
```
Console shows:
  firstName = "Cher"
  lastName = ""
✅ Enrichment completes successfully
```

### Test 3: Multiple Keys (Key Rotation)
1. Add multiple API keys in Admin Panel
2. Fill in prospect data
3. Click "Enrich Phones"
4. Check console logs

**Expected Result:**
```
Console shows:
  🔎 [Attempt 1] Fetching FRESH list of active PHONE_ONLY keys...
  ✅ Found 3 active PHONE_ONLY keys
  🔑 [1/50] Trying key ending in ...XXXX
  ⛔ Key (...XXXX) is OUT OF CREDITS (HTTP 429)
  🔄 Marked as EXHAUSTED. Retrying with next key...
  🔑 [2/50] Trying key ending in ...YYYY
  ✅ Success! Got data from Lusha API (HTTP 200)
```

### Test 4: No Data Found
1. Fill in:
   - Full Name: "XYZ123ABC"
   - Company: "NonExistentCorp999"
2. Click "Enrich Phones"

**Expected Result:**
```
❌ Profile not found in Lusha database (HTTP 404)
Toast: "Phone Enrichment Complete: 0 found, 1 failed"
```

---

## 🔍 Console Logging (Debugging)

Open browser DevTools (F12) and go to Console tab. You'll see detailed logs:

```
👤 Starting Name+Company enrichment (PHONE_ONLY)
📋 Name: Swadhin Jamkar
🏢 Company: Bajaj Finserv

🚀 Starting enrichment with PHONE_ONLY pool...

🔎 [Attempt 1] Fetching FRESH list of active PHONE_ONLY keys...
✅ Found 1 active PHONE_ONLY keys
🔑 [1/50] Trying key ending in ...cfc2 (1 total keys available)

📡 Calling Lusha API via Supabase Edge Function...
🔑 Using API key ending in ...cfc2
📋 Parameters: { firstName: 'Swadhin', lastName: 'Jamkar', companyName: 'Bajaj Finserv' }

🌐 Using CORS proxy for localhost compatibility
📡 Proxied URL: https://corsproxy.io/?https%3A%2F%2Fapi.lusha.com%2Fv2%2Fperson%3F...

📊 Response Status: 200
📊 Response Data: { contact: { data: { ... } } }

✅ Success! Got data from Lusha API (HTTP 200)
✅ Successfully extracted contact data with key (...cfc2)
```

---

## 🛠️ Troubleshooting

### Issue: "No active PHONE_ONLY keys available"
**Solution:** Add API keys in Admin Panel
1. Go to Admin Panel
2. Click "Add New API Keys"
3. Select "Phone Only"
4. Paste your Lusha API key
5. Click "Add Keys"

### Issue: "Profile not found in Lusha database"
**Solution:** Try different name/company combination
- Use exact spelling
- Try full legal company name
- Check if profile exists in Lusha database

### Issue: "All keys are exhausted"
**Solution:** Add more API keys or wait for credits to reset

### Issue: CORS errors in console
**Solution:** The CORS proxy should handle this, but if you see errors:
1. Check that Edge Function is deployed: `supabase functions list`
2. Restart Supabase: `supabase stop` then `supabase start`
3. Redeploy Edge Function: `supabase functions deploy lusha-enrich-proxy`

### Issue: Enrichment not triggering
**Solution:** Check:
1. Both Full Name AND Company are filled
2. Phone column is empty
3. No LinkedIn URL is present
4. Check console for errors (F12)

---

## 📊 Key Features

### Smart Key Rotation
- Fetches FRESH keys on every iteration (like Python script)
- Tries keys in order of least recently used
- Marks dead keys (429, 401) automatically
- Continues to next key immediately on failure
- Stops on success (200) or not-found (404)

### Name Splitting
- "Swadhin Jamkar" → firstName: "Swadhin", lastName: "Jamkar"
- "Cher" → firstName: "Cher", lastName: ""
- "John Smith Jr" → firstName: "John", lastName: "Smith Jr"

### CORS Proxy
- Uses corsproxy.io for localhost development
- Bypasses browser CORS restrictions
- Works seamlessly with Supabase Edge Function

### Real-time Feedback
- Console logs every step
- Toast notifications for results
- Progress indicator during enrichment
- Status updates in spreadsheet

---

## 🚀 Deployment to Production

When ready to deploy:

1. Remove CORS proxy (production doesn't need it):
   ```typescript
   // In supabase/functions/lusha-enrich-proxy/index.ts
   // Change from:
   const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(lushaUrl.toString())}`;
   // To:
   const finalUrl = lushaUrl.toString();
   ```

2. Deploy to production:
   ```bash
   supabase functions deploy lusha-enrich-proxy --project-ref <your-project-id>
   ```

3. Build and deploy frontend:
   ```bash
   npm run build
   # Deploy to your hosting (Vercel, Netlify, etc.)
   ```

---

## 📋 API Key Management

### Add Keys
1. Go to Admin Panel
2. Click "Add New API Keys"
3. Select category (Phone Only / Email Only)
4. Paste API keys (one per line)
5. Click "Add Keys"

### View Key Status
1. Go to Admin Panel
2. See "Manage API Keys" section
3. Check Status column:
   - ACTIVE: Ready to use
   - EXHAUSTED: Out of credits
   - INVALID: Invalid or expired
   - SUSPENDED: Manually disabled

### Monitor Usage
- Last Used: Shows when key was last used
- Credits: Shows remaining credits (if available)
- Active: Toggle to enable/disable key

---

## 🎯 Expected Behavior

### Success Case
```
Input: Full Name = "Swadhin Jamkar", Company = "Bajaj Finserv"
Output: Phone = "+91-XXXXXXXXXX"
Status: ✅ Phone Enrichment Complete: 1 found, 0 failed
```

### Partial Success
```
Input: Full Name = "John Smith", Company = "Unknown Corp"
Output: Phone = "+1-555-0123", Email = "john@example.com"
Status: ✅ Phone Enrichment Complete: 1 found, 0 failed
```

### Failure Case
```
Input: Full Name = "XYZ123", Company = "NonExistent"
Output: No data
Status: ❌ Phone Enrichment Complete: 0 found, 1 failed
```

---

## 📞 Support

If you encounter issues:

1. Check console logs (F12)
2. Verify API keys are added in Admin Panel
3. Ensure Supabase is running: `supabase status`
4. Check Edge Function logs: `supabase functions list`
5. Restart services if needed: `supabase stop` then `supabase start`

---

**Status:** ✅ READY FOR LOCAL TESTING

**Version:** 5.1.0  
**Last Updated:** November 25, 2025

Happy enriching! 🚀
