# API Test Tool - Visual Guide

## Where to Find It

```
Navigation
    ↓
Click "Admin"
    ↓
Admin Panel Opens
    ↓
Click "Lusha API Manager" tab
    ↓
Scroll to top
    ↓
Find BLUE section: "API Test Tool"
    ↓
You're here! 🎯
```

## What It Looks Like

```
┌─────────────────────────────────────────────────────────────┐
│ 🧪 API Test Tool                                            │
│ Test if the Lusha API is working before running enrichment  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Test with LinkedIn URL] [Test with Name + Company]        │
│                                                             │
│ [Phone Only] [Email Only]                                  │
│                                                             │
│ LinkedIn URL: [_________________________________]          │
│                                                             │
│ [Run API Test]                                              │
│                                                             │
│ ✅ Test Successful!                                         │
│ Phone: +1-206-555-1234                                      │
│ Email: satya@microsoft.com                                  │
│ Name: Satya Nadella                                         │
│ Company: Microsoft                                          │
│ Title: CEO                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Test Mode 1: LinkedIn URL

### Input
```
┌─────────────────────────────────────────┐
│ Test with LinkedIn URL                  │
├─────────────────────────────────────────┤
│                                         │
│ LinkedIn URL:                           │
│ [https://www.linkedin.com/in/...]       │
│                                         │
│ Category:                               │
│ [Phone Only] [Email Only]               │
│                                         │
│ [Run API Test]                          │
│                                         │
└─────────────────────────────────────────┘
```

### Success Result
```
┌─────────────────────────────────────────┐
│ ✅ Test Successful!                     │
│                                         │
│ Phone: +1-206-555-1234                  │
│ Email: satya@microsoft.com              │
│ Name: Satya Nadella                     │
│ Company: Microsoft                      │
│ Title: Chief Executive Officer          │
│                                         │
└─────────────────────────────────────────┘
```

### Failure Result
```
┌─────────────────────────────────────────┐
│ ❌ Test Failed                          │
│                                         │
│ No active PHONE_ONLY keys available     │
│                                         │
│ Solution: Add API keys in "Add New      │
│ API Keys" section                       │
│                                         │
└─────────────────────────────────────────┘
```

## Test Mode 2: Name + Company

### Input
```
┌──────────────────────────────────────────────────┐
│ Test with Name + Company                         │
├──────────────────────────────────────────────────┤
│                                                  │
│ First Name:    [Satya]                           │
│ Last Name:     [Nadella]                         │
│ Company Name:  [Microsoft]                       │
│                                                  │
│ Category:                                        │
│ [Phone Only] [Email Only]                        │
│                                                  │
│ [Run API Test]                                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Success Result
```
┌──────────────────────────────────────────────────┐
│ ✅ Test Successful!                              │
│                                                  │
│ Phone: +1-206-555-1234                           │
│ Email: satya@microsoft.com                       │
│ Name: Satya Nadella                              │
│ Company: Microsoft                               │
│ Title: Chief Executive Officer                   │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Step-by-Step Walkthrough

### Step 1: Navigate to Admin Panel
```
┌─────────────────────────────────────────┐
│ Navigation Bar                          │
│ [Dashboard] [RTNE] [Admin] [Logout]     │
│                      ↑                  │
│                   Click here            │
└─────────────────────────────────────────┘
```

### Step 2: Click Lusha API Manager Tab
```
┌─────────────────────────────────────────┐
│ Admin Panel Tabs                        │
│ [User Management] [Lusha API Manager]   │
│                    ↑                    │
│                 Click here              │
└─────────────────────────────────────────┘
```

### Step 3: Find API Test Tool
```
┌─────────────────────────────────────────┐
│ Page Content                            │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🧪 API Test Tool (BLUE SECTION)     │ │
│ │ ↑                                   │ │
│ │ You're looking for this!            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Add New API Keys                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Manage API Keys                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Step 4: Choose Test Mode
```
┌─────────────────────────────────────────┐
│ API Test Tool                           │
│                                         │
│ [Test with LinkedIn URL]                │
│ [Test with Name + Company]              │
│  ↑                                      │
│  Click one of these                     │
│                                         │
└─────────────────────────────────────────┘
```

### Step 5: Enter Test Data
```
LinkedIn URL Mode:
┌─────────────────────────────────────────┐
│ LinkedIn URL:                           │
│ [https://www.linkedin.com/in/...]       │
│  ↑                                      │
│  Enter URL here                         │
└─────────────────────────────────────────┘

Name + Company Mode:
┌─────────────────────────────────────────┐
│ First Name:    [John]                   │
│ Last Name:     [Smith]                  │
│ Company Name:  [Google]                 │
│  ↑                                      │
│  Enter data here                        │
└─────────────────────────────────────────┘
```

### Step 6: Select Category
```
┌─────────────────────────────────────────┐
│ Category:                               │
│ [Phone Only] [Email Only]               │
│  ↑           ↑                          │
│  Click one   (or both separately)       │
└─────────────────────────────────────────┘
```

### Step 7: Run Test
```
┌─────────────────────────────────────────┐
│ [Run API Test]                          │
│  ↑                                      │
│  Click to start test                    │
└─────────────────────────────────────────┘
```

### Step 8: Check Results
```
Success:
┌─────────────────────────────────────────┐
│ ✅ Test Successful!                     │
│ Phone: +1-555-1234                      │
│ Email: john@google.com                  │
│  ↑                                      │
│  API is working! ✅                     │
└─────────────────────────────────────────┘

Failure:
┌─────────────────────────────────────────┐
│ ❌ Test Failed                          │
│ No active PHONE_ONLY keys available     │
│  ↑                                      │
│  API not working, fix issue             │
└─────────────────────────────────────────┘
```

### Step 9: Check Console Logs
```
Browser DevTools:
┌─────────────────────────────────────────┐
│ F12 → Console Tab                       │
│                                         │
│ 🧪 Starting API Test...                 │
│ 📋 Mode: linkedin                       │
│ 🔍 Category: PHONE_ONLY                 │
│ 🔗 Testing with LinkedIn URL: ...       │
│ 📡 Calling Lusha API...                 │
│ 🔑 Using API key ending in ...XXXX      │
│ 📊 Response Status: 200                 │
│ ✅ Successfully extracted contact data  │
│  ↑                                      │
│  These logs show what's happening       │
└─────────────────────────────────────────┘
```

## Common Workflows

### Workflow 1: Test LinkedIn URL
```
1. Admin → Lusha API Manager
2. Find "API Test Tool" (blue section)
3. Click "Test with LinkedIn URL"
4. Enter: https://www.linkedin.com/in/satya-nadella/
5. Select: Phone Only
6. Click "Run API Test"
7. Result: Shows phone number ✅
```

### Workflow 2: Test Name + Company
```
1. Admin → Lusha API Manager
2. Find "API Test Tool" (blue section)
3. Click "Test with Name + Company"
4. Enter:
   - First Name: Sundar
   - Last Name: Pichai
   - Company: Google
5. Select: Email Only
6. Click "Run API Test"
7. Result: Shows email ✅
```

### Workflow 3: Full Testing
```
1. Test with LinkedIn URL + Phone Only
   Result: ✅ Phone found
2. Test with LinkedIn URL + Email Only
   Result: ✅ Email found
3. Test with Name + Company + Phone Only
   Result: ✅ Phone found
4. Test with Name + Company + Email Only
   Result: ✅ Email found
5. All tests passed! Go to RTNE and enrich ✅
```

## Error Scenarios

### Error 1: No API Keys
```
Input:
- LinkedIn URL: https://www.linkedin.com/in/satya-nadella/
- Category: Phone Only

Result:
❌ Test Failed
No active PHONE_ONLY keys available

Fix:
1. Go to "Add New API Keys" section
2. Select "Phone Only"
3. Paste API keys
4. Click "Add Keys"
5. Try test again
```

### Error 2: Invalid API Key
```
Input:
- Name: John Smith
- Company: Google
- Category: Email Only

Result:
❌ Test Failed
HTTP 401 - Invalid Key

Fix:
1. Check API key is correct
2. Check key hasn't expired
3. Try with different key
4. Try test again
```

### Error 3: Out of Credits
```
Input:
- LinkedIn URL: https://www.linkedin.com/in/john-smith/
- Category: Phone Only

Result:
❌ Test Failed
HTTP 429 - Out of Credits

Fix:
1. Add new API key with credits
2. Or check Lusha account for more credits
3. Try test again
```

### Error 4: Profile Not Found
```
Input:
- Name: Fake Person
- Company: Fake Company
- Category: Phone Only

Result:
❌ Test Failed
Profile not found in Lusha database (HTTP 404)

Fix:
1. This is normal - person doesn't exist in Lusha
2. Try with different person
3. Try with real LinkedIn URL
```

## Success Indicators

### ✅ Test Passed
- Green success box appears
- Shows extracted data (phone, email, name, company, title)
- Console logs show "✅ Successfully extracted contact data"
- No error messages

### ❌ Test Failed
- Red error box appears
- Shows error message
- Console logs show "❌ Error" or "⛔ Key is..."
- Specific error description

## Next Steps After Testing

### If Test Passes ✅
```
1. Go to RTNE spreadsheet
2. Enter prospect data
3. Click "Enrich Phones" or "Enrich Emails"
4. Data should populate ✅
```

### If Test Fails ❌
```
1. Read error message
2. Check console logs
3. Fix the issue
4. Run test again
5. Once test passes, try enrichment
```

## Tips

- **Test with real data** - Use actual LinkedIn URLs or names
- **Test both categories** - Try Phone Only and Email Only
- **Check console logs** - They show exactly what's happening
- **Test before bulk enrichment** - Saves time and frustration
- **Keep API keys active** - Deactivate only when not needed

---

**Now you know exactly how to use the API Test Tool!**
