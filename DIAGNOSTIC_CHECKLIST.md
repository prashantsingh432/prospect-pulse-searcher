# Lusha Integration Diagnostic Checklist

## What Was Fixed
✅ **Removed CORS proxy from direct HTTP calls** - The service was trying to call Lusha directly with a CORS proxy wrapper, which is unreliable
✅ **Switched to Supabase Edge Function** - Now all API calls go through `lusha-enrich-proxy` Edge Function (server-side)
✅ **Removed CORS proxy from Edge Function** - Edge Functions run on Supabase servers, so no CORS issues

## Testing Steps

### 1. Verify API Keys Are Set Up
- [ ] Go to Admin Panel → Lusha API Keys
- [ ] Check that you have at least 1 PHONE_ONLY key
- [ ] Check that you have at least 1 EMAIL_ONLY key
- [ ] Keys should show status "ACTIVE"

### 2. Test Single Enrichment (LinkedIn URL)
- [ ] Enter a LinkedIn URL in the spreadsheet (e.g., `https://www.linkedin.com/in/[username]/`)
- [ ] Enter a Company Name in the same row
- [ ] Click "Enrich Phones" button
- [ ] Check browser console (F12) for logs
- [ ] Expected: Phone number should appear in Primary Phone column

### 3. Test Single Enrichment (Name + Company)
- [ ] Enter Full Name (e.g., "John Smith")
- [ ] Enter Company Name (e.g., "Google")
- [ ] The enrichment should trigger automatically
- [ ] Check browser console for logs
- [ ] Expected: Phone and/or Email should populate

### 4. Check Browser Console Logs
Open DevTools (F12) and look for these log patterns:

**Good logs (enrichment working):**
```
📡 Calling Lusha API via Supabase Edge Function...
🔑 Using API key ending in ...XXXX
📋 Parameters: {...}
📊 Response Status: 200
✅ Successfully extracted contact data
```

**Bad logs (something is broken):**
```
❌ Edge Function Error: [error message]
❌ Network Error: [error message]
⛔ Key is OUT OF CREDITS (HTTP 429)
⛔ Key is INVALID/EXPIRED (HTTP 401)
```

### 5. Check Supabase Edge Function Status
- [ ] Go to Supabase Dashboard → Edge Functions
- [ ] Find `lusha-enrich-proxy` function
- [ ] Check if it's deployed (should show green status)
- [ ] Check recent logs for errors

### 6. Verify Database Tables
- [ ] Check `lusha_api_keys` table has your keys
- [ ] Check `rtne_requests` table is being populated when you enter data

## Common Issues & Solutions

### Issue: "No active PHONE_ONLY keys available"
**Solution:** Add API keys in Admin Panel with correct category

### Issue: "HTTP 401 - Invalid Key"
**Solution:** Check that API key is correct and not expired in Lusha dashboard

### Issue: "HTTP 429 - Out of Credits"
**Solution:** Add more API keys or check Lusha account credits

### Issue: Edge Function not responding
**Solution:** 
1. Check Supabase Edge Function logs
2. Verify function is deployed
3. Check network tab in DevTools for failed requests

### Issue: Still getting CORS errors
**Solution:** This should NOT happen anymore since we're using Edge Function. If it does:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check that Edge Function is deployed

## Next Steps If Still Not Working

1. **Check the exact error message** in browser console
2. **Share the error logs** from:
   - Browser console (F12)
   - Supabase Edge Function logs
3. **Verify API key format** - Should be a long string, not empty
4. **Test with curl** (if you have terminal access):
   ```bash
   curl -X GET "https://api.lusha.com/v2/person?linkedinUrl=https://www.linkedin.com/in/[username]/" \
     -H "api_key: YOUR_KEY_HERE"
   ```

## Files Modified
- `src/services/lushaService.ts` - Now uses Edge Function instead of direct HTTP
- `supabase/functions/lusha-enrich-proxy/index.ts` - Removed CORS proxy wrapper
