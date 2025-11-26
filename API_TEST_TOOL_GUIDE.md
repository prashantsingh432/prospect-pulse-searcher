# API Test Tool Guide

## What's New
I've added an **API Test Tool** to the Admin Panel → Lusha API Manager tab. This lets you test if the Lusha API is working before running enrichment.

## How to Use

### Step 1: Go to Admin Panel
1. Click "Admin" in the navigation
2. Go to "Lusha API Manager" tab

### Step 2: Find the API Test Tool
Look for the blue section titled "API Test Tool" at the top of the page.

### Step 3: Choose Test Mode

#### Option A: Test with LinkedIn URL
1. Click "Test with LinkedIn URL" button
2. Enter a LinkedIn profile URL (e.g., `https://www.linkedin.com/in/satya-nadella/`)
3. Choose category: "Phone Only" or "Email Only"
4. Click "Run API Test"

#### Option B: Test with Name + Company
1. Click "Test with Name + Company" button
2. Enter:
   - First Name (e.g., "Satya")
   - Last Name (e.g., "Nadella")
   - Company Name (e.g., "Microsoft")
3. Choose category: "Phone Only" or "Email Only"
4. Click "Run API Test"

### Step 4: Check Results

#### ✅ If Test Succeeds
You'll see:
- Green success message
- Extracted data (phone, email, name, company, title)
- Example:
  ```
  ✅ Test Successful!
  Phone: +1-555-1234
  Email: satya@microsoft.com
  Name: Satya Nadella
  Company: Microsoft
  Title: CEO
  ```

#### ❌ If Test Fails
You'll see:
- Red error message
- Error description
- Example:
  ```
  ❌ Test Failed
  No active PHONE_ONLY keys available
  ```

### Step 5: Check Console Logs
Open browser DevTools (F12) and go to Console tab to see detailed logs:

**Good logs (API working):**
```
🧪 Starting API Test...
📋 Mode: linkedin
🔍 Category: PHONE_ONLY
🔗 Testing with LinkedIn URL: https://www.linkedin.com/in/satya-nadella/
📡 Calling Lusha API via Supabase Edge Function...
🔑 Using API key ending in ...XXXX
📊 Response Status: 200
✅ Successfully extracted contact data
📊 Test Result: {success: true, phone: "+1-555-1234", ...}
```

**Bad logs (API not working):**
```
❌ Edge Function Error: [error message]
⛔ Key is INVALID/EXPIRED (HTTP 401)
⛔ Key is OUT OF CREDITS (HTTP 429)
```

---

## Common Test Scenarios

### Scenario 1: Test Phone Enrichment with LinkedIn URL
```
Mode: Test with LinkedIn URL
URL: https://www.linkedin.com/in/satya-nadella/
Category: Phone Only
Expected: Phone number populated
```

### Scenario 2: Test Email Enrichment with Name + Company
```
Mode: Test with Name + Company
First Name: Sundar
Last Name: Pichai
Company: Google
Category: Email Only
Expected: Email address populated
```

### Scenario 3: Test Both Phone and Email
```
Run test twice:
1. First with "Phone Only" category
2. Then with "Email Only" category
Expected: Both phone and email populated
```

---

## Troubleshooting

### Error: "No active PHONE_ONLY keys available"
**Solution:** 
1. Add API keys in the "Add New API Keys" section
2. Make sure they're set to "Phone Only" category
3. Check that status is "ACTIVE"

### Error: "HTTP 401 - Invalid Key"
**Solution:**
1. Check that the API key is correct
2. Verify the key hasn't expired in Lusha dashboard
3. Try with a different key

### Error: "HTTP 429 - Out of Credits"
**Solution:**
1. The key has run out of credits
2. Add a new key with available credits
3. Or check your Lusha account for more credits

### Error: "Profile not found in Lusha database (HTTP 404)"
**Solution:**
1. This is normal - the profile doesn't exist in Lusha
2. Try with a different LinkedIn URL or name
3. The API is working, just no data for this person

### Error: "Edge Function Error"
**Solution:**
1. Check that Supabase Edge Function is deployed
2. Go to Supabase Dashboard → Edge Functions → lusha-enrich-proxy
3. Check if it shows "Deployed" status
4. Check the logs for errors

### No response or timeout
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check internet connection
3. Check Supabase status
4. Try again

---

## What the Test Tool Does

1. **Validates Input** - Checks that you entered required fields
2. **Calls Lusha API** - Makes a test API call via Supabase Edge Function
3. **Parses Response** - Extracts phone, email, name, company, title
4. **Shows Results** - Displays success or error with details
5. **Logs Everything** - Writes detailed logs to browser console

---

## Why Test Before Enrichment?

1. **Verify API Keys** - Make sure your keys are valid and have credits
2. **Check Connectivity** - Ensure Supabase Edge Function is working
3. **Test Data** - Verify that Lusha has data for your prospects
4. **Debug Issues** - See exact error messages before bulk enrichment
5. **Save Time** - Catch problems early instead of running bulk enrichment

---

## Next Steps After Testing

### If Test Succeeds ✅
1. Go to RTNE spreadsheet
2. Enter prospect data (Full Name + Company or LinkedIn URL)
3. Click "Enrich Phones" or "Enrich Emails"
4. Data should populate

### If Test Fails ❌
1. Check the error message
2. Fix the issue (add keys, check API key, etc.)
3. Run test again
4. Once test passes, try enrichment

---

## Example Test Walkthrough

### Test 1: LinkedIn URL with Phone
```
1. Go to Admin → Lusha API Manager
2. Click "Test with LinkedIn URL"
3. Enter: https://www.linkedin.com/in/satya-nadella/
4. Select: Phone Only
5. Click "Run API Test"
6. Result: ✅ Phone: +1-206-555-1234
```

### Test 2: Name + Company with Email
```
1. Click "Test with Name + Company"
2. Enter:
   - First Name: Sundar
   - Last Name: Pichai
   - Company: Google
3. Select: Email Only
4. Click "Run API Test"
5. Result: ✅ Email: sundar.pichai@google.com
```

### Test 3: Bulk Enrichment
```
1. Both tests passed ✅
2. Go to RTNE spreadsheet
3. Add 5 rows with Full Name + Company
4. Click "Enrich Phones"
5. Result: All 5 rows populated with phone numbers
```

---

## Tips

- **Test with real LinkedIn URLs** - Use actual profiles for best results
- **Test both categories** - Try Phone Only and Email Only separately
- **Check console logs** - They show exactly what's happening
- **Test before bulk enrichment** - Saves time and frustration
- **Keep API keys active** - Deactivate only when not needed

---

## Questions?

If the test tool isn't working:
1. Check browser console (F12) for error messages
2. Check Supabase Edge Function logs
3. Verify API keys are set up
4. Make sure Edge Function is deployed
5. Try hard refresh (Ctrl+Shift+R)

---

**Status:** ✅ API Test Tool is ready to use!
