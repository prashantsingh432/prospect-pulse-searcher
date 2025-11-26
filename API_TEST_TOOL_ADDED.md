# API Test Tool - Added to Admin Panel

## What I Added

I've added a **comprehensive API Test Tool** to the Admin Panel → Lusha API Manager section. This lets you test if the Lusha API is working before running enrichment.

## Location
**Admin Panel → Lusha API Manager → API Test Tool** (blue section at the top)

## Features

### 1. Two Test Modes
- **Test with LinkedIn URL** - Enter a LinkedIn profile URL
- **Test with Name + Company** - Enter First Name, Last Name, Company

### 2. Category Selection
- **Phone Only** - Test phone number enrichment
- **Email Only** - Test email enrichment

### 3. Real-Time Results
- ✅ **Success** - Shows extracted data (phone, email, name, company, title)
- ❌ **Failure** - Shows error message with details

### 4. Detailed Logging
- Console logs show exactly what's happening
- Helps debug issues quickly

### 5. Visual Feedback
- Green success box with extracted data
- Red error box with error message
- Loading indicator while testing

## How to Use

### Quick Test (LinkedIn URL)
```
1. Go to Admin → Lusha API Manager
2. Click "Test with LinkedIn URL"
3. Enter: https://www.linkedin.com/in/satya-nadella/
4. Select: Phone Only
5. Click "Run API Test"
6. Result: Shows phone number if found
```

### Quick Test (Name + Company)
```
1. Click "Test with Name + Company"
2. Enter:
   - First Name: Sundar
   - Last Name: Pichai
   - Company: Google
3. Select: Email Only
4. Click "Run API Test"
5. Result: Shows email if found
```

## What It Tests

✅ **API Key Validity** - Checks if your API key is valid
✅ **API Key Credits** - Checks if key has credits remaining
✅ **Supabase Edge Function** - Verifies Edge Function is working
✅ **Lusha API Connection** - Tests connection to Lusha API
✅ **Data Availability** - Checks if Lusha has data for the prospect

## Error Messages You Might See

| Error | Meaning | Solution |
|-------|---------|----------|
| "No active PHONE_ONLY keys available" | No valid phone keys | Add keys in "Add New API Keys" section |
| "HTTP 401 - Invalid Key" | API key is invalid | Check key is correct, not expired |
| "HTTP 429 - Out of Credits" | Key has no credits | Add new key or check Lusha account |
| "Profile not found (HTTP 404)" | Person not in Lusha | Try different LinkedIn URL or name |
| "Edge Function Error" | Edge Function not working | Check Supabase deployment |

## Success Indicators

✅ Test shows green success box
✅ Extracted data is displayed (phone, email, name, company, title)
✅ Console logs show "✅ Successfully extracted contact data"
✅ No error messages

## Next Steps After Testing

### If Test Succeeds ✅
1. Go to RTNE spreadsheet
2. Enter prospect data
3. Click "Enrich Phones" or "Enrich Emails"
4. Data should populate

### If Test Fails ❌
1. Read the error message
2. Fix the issue (add keys, check API key, etc.)
3. Run test again
4. Once test passes, try enrichment

## Files Modified

**`src/components/LushaApiManager.tsx`**
- Added API test state (testMode, testLinkedInUrl, testFirstName, etc.)
- Added `handleTestApi()` function to run tests
- Added API Test Tool UI section with:
  - Mode selection (LinkedIn URL or Name + Company)
  - Category selection (Phone Only or Email Only)
  - Input fields for test data
  - Test button
  - Result display (success or error)
  - Instructions

## Why This Helps

1. **Verify API is Working** - Before running bulk enrichment
2. **Debug Issues** - See exact error messages
3. **Test Different Scenarios** - Try LinkedIn URL and Name + Company
4. **Save Time** - Catch problems early
5. **Build Confidence** - Know the API is working before enrichment

## Console Logs

When you run a test, check the browser console (F12) for detailed logs:

**Good logs:**
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

**Bad logs:**
```
❌ Edge Function Error: [error message]
⛔ Key is INVALID/EXPIRED (HTTP 401)
⛔ Key is OUT OF CREDITS (HTTP 429)
```

## Testing Workflow

```
1. Add API Keys
   ↓
2. Run API Test
   ↓
3. If Test Passes ✅
   ↓
4. Go to RTNE Spreadsheet
   ↓
5. Enter Prospect Data
   ↓
6. Click "Enrich Phones" or "Enrich Emails"
   ↓
7. Data Populates ✅
```

## Example Test Results

### Success Example
```
✅ Test Successful!
Phone: +1-206-555-1234
Email: satya@microsoft.com
Name: Satya Nadella
Company: Microsoft
Title: Chief Executive Officer
```

### Failure Example
```
❌ Test Failed
No active PHONE_ONLY keys available

Solution: Add API keys in "Add New API Keys" section
```

## Tips

- **Test with real LinkedIn URLs** - Use actual profiles
- **Test both categories** - Try Phone Only and Email Only
- **Check console logs** - They show what's happening
- **Test before bulk enrichment** - Saves time
- **Keep API keys active** - Deactivate only when not needed

## Status

✅ **API Test Tool Added**
✅ **Ready to Use**
✅ **Comprehensive Error Handling**
✅ **Detailed Logging**

## Next Steps

1. Go to Admin Panel
2. Click "Lusha API Manager"
3. Find the blue "API Test Tool" section
4. Enter test data
5. Click "Run API Test"
6. Check results and console logs

---

**Now you can test if the API is working before running enrichment!**
