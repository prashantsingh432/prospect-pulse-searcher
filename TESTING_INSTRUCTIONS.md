# Testing Instructions - Lusha Enrichment Fix

## What Was Fixed
The enrichment feature was broken because it was trying to make direct HTTP calls to Lusha API with a CORS proxy wrapper. This has been fixed by routing all calls through Supabase Edge Function (server-side).

## Before You Test
1. **Deploy the code changes** to your environment
2. **Ensure Supabase Edge Function is deployed** - Check Supabase dashboard
3. **Have API keys set up** - Go to Admin Panel → Lusha API Keys

## Test 1: Verify API Keys Exist

### Steps:
1. Go to your app → Admin Panel
2. Click "Lusha API Keys"
3. You should see at least:
   - 1 key with category "PHONE_ONLY" and status "ACTIVE"
   - 1 key with category "EMAIL_ONLY" and status "ACTIVE"

### Expected Result:
✅ Keys are listed and show "ACTIVE" status

### If Failed:
❌ Add new keys in the Admin Panel

---

## Test 2: Test Enrichment with LinkedIn URL

### Steps:
1. Open the RTNE spreadsheet
2. In Row 1, enter:
   - **Full Name:** Satya Nadella
   - **Company Name:** Microsoft
   - **LinkedIn URL:** https://www.linkedin.com/in/satya-nadella/
3. Click the **"Enrich Phones"** button
4. Open browser DevTools (F12) → Console tab
5. Look for logs starting with 📡

### Expected Result:
✅ You should see logs like:
```
📡 Calling Lusha API via Supabase Edge Function...
🔑 Using API key ending in ...XXXX
📋 Parameters: {linkedinUrl: "https://www.linkedin.com/in/satya-nadella/"}
📊 Response Status: 200
✅ Successfully extracted contact data
```

✅ A phone number should appear in the "Primary Phone" column

### If Failed:
❌ Check the error logs in console

---

## Test 3: Test Enrichment with Name + Company

### Steps:
1. In Row 2, enter:
   - **Full Name:** Sundar Pichai
   - **Company Name:** Google
2. Wait 2 seconds (enrichment should trigger automatically)
3. Open browser DevTools (F12) → Console tab
4. Look for logs

### Expected Result:
✅ Logs should show enrichment attempt
✅ Phone and/or Email should populate automatically

### If Failed:
❌ Check console for error messages

---

## Test 4: Bulk Enrichment

### Steps:
1. Add 5 rows with Full Name + Company Name (no phone numbers)
2. Click **"Enrich Phones"** button
3. Watch the progress indicator
4. Check console logs

### Expected Result:
✅ Progress bar shows "1 of 5", "2 of 5", etc.
✅ Phone numbers populate in rows
✅ Toast notification shows "Phone Enrichment Complete: X found, Y failed"

### If Failed:
❌ Check if API keys have credits remaining

---

## Debugging: Reading Console Logs

### Good Logs (Enrichment Working):
```
📡 Calling Lusha API via Supabase Edge Function...
🔑 Using API key ending in ...XXXX
📋 Parameters: {...}
📊 Response Status: 200
✅ Successfully extracted contact data
```

### Bad Logs (Something Broken):

**Error: Edge Function not responding**
```
❌ Edge Function Error: [error message]
```
→ Check Supabase Edge Function is deployed

**Error: Invalid API Key**
```
⛔ Key is INVALID/EXPIRED (HTTP 401)
```
→ Check API key in Admin Panel

**Error: Out of Credits**
```
⛔ Key is OUT OF CREDITS (HTTP 429)
```
→ Add more API keys or check Lusha account

**Error: Profile Not Found**
```
❌ Profile not found in Lusha database (HTTP 404)
```
→ This is normal - profile doesn't exist in Lusha

---

## Debugging: Check Supabase Edge Function

### Steps:
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Find "lusha-enrich-proxy"
4. Click on it
5. Check the "Logs" tab for recent activity

### What to Look For:
✅ Recent invocations with status 200
❌ Errors or failed invocations

---

## Debugging: Check Database

### Check API Keys Table:
1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Run:
```sql
SELECT id, key_value, category, status, is_active, credits_remaining 
FROM lusha_api_keys 
ORDER BY created_at DESC;
```

### Expected Result:
- At least 1 row with category "PHONE_ONLY" and status "ACTIVE"
- At least 1 row with category "EMAIL_ONLY" and status "ACTIVE"

### Check RTNE Requests Table:
```sql
SELECT * FROM rtne_requests 
WHERE user_id = '[YOUR_USER_ID]' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## If Still Not Working

### Step 1: Clear Cache
- Hard refresh browser: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

### Step 2: Check Network Tab
1. Open DevTools (F12)
2. Go to "Network" tab
3. Try enrichment again
4. Look for request to "lusha-enrich-proxy"
5. Check if it returns 200 or error

### Step 3: Check Exact Error
1. Open DevTools Console
2. Look for any red error messages
3. Copy the full error message
4. Share it for debugging

### Step 4: Verify Edge Function Deployment
1. Go to Supabase Dashboard
2. Click "Edge Functions"
3. Find "lusha-enrich-proxy"
4. Check if it shows "Deployed" status
5. If not deployed, deploy it manually

---

## Success Checklist

- [ ] API keys are set up in Admin Panel
- [ ] At least 1 PHONE_ONLY key with ACTIVE status
- [ ] At least 1 EMAIL_ONLY key with ACTIVE status
- [ ] Supabase Edge Function "lusha-enrich-proxy" is deployed
- [ ] Test 1 passed (API keys visible)
- [ ] Test 2 passed (LinkedIn URL enrichment works)
- [ ] Test 3 passed (Name + Company enrichment works)
- [ ] Test 4 passed (Bulk enrichment works)
- [ ] Console logs show "✅ Successfully extracted contact data"

---

## What Changed in the Code

### File: `src/services/lushaService.ts`
- **Removed:** Direct HTTP calls with CORS proxy wrapper
- **Added:** Supabase Edge Function invocation
- **Result:** No more CORS issues, reliable API calls

### File: `supabase/functions/lusha-enrich-proxy/index.ts`
- **Removed:** CORS proxy wrapper
- **Added:** Direct Lusha API calls (server-side)
- **Result:** Clean, simple, reliable implementation

---

## Questions?

If enrichment still isn't working:
1. Check the console logs (F12)
2. Check Supabase Edge Function logs
3. Verify API keys are set up
4. Make sure Edge Function is deployed
5. Share the exact error message for debugging
