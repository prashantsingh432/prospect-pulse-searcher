# Troubleshooting Guide - Lusha Service Rewrite

## Common Issues & Solutions

### Issue 1: CORS Error in Browser Console
**Error:** `Access to fetch at 'https://api.lusha.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Cause:** CORS proxy not being used

**Solution:**
1. Check browser console for "Proxied URL" log
2. Verify it starts with `https://corsproxy.io/?`
3. If not, check `makeLushaApiCall()` is being called
4. Verify `CORS_PROXY` constant is defined at top of `lushaService.ts`

**Debug:**
```typescript
// In makeLushaApiCall(), add this log:
console.log(`🌐 Proxied URL: ${proxiedUrl}`);
// Should show: https://corsproxy.io/?https%3A%2F%2Fapi.lusha.com%2F...
```

---

### Issue 2: "No API Keys Available" Error
**Error:** `All PHONE_ONLY keys are exhausted or invalid. Please add more API keys in Admin Panel.`

**Cause:** All keys marked as EXHAUSTED or INVALID, or no keys exist

**Solution:**
1. Go to Admin Panel → Manage API Keys
2. Check if any keys have status "ACTIVE"
3. If all are EXHAUSTED/INVALID, add new keys
4. Toggle "Active" switch to enable keys

**Debug:**
```typescript
// Check Supabase directly:
// SELECT * FROM lusha_api_keys WHERE category = 'PHONE_ONLY' AND status = 'ACTIVE' AND is_active = true;
```

---

### Issue 3: Enrichment Returns "Not Found" (404)
**Error:** `Profile does not exist in Lusha database`

**Cause:** Profile genuinely doesn't exist in Lusha's database

**Solution:**
1. Verify LinkedIn URL is correct and public
2. Try with different Name + Company combination
3. Check if profile is indexed by Lusha (may take time)
4. This is expected behavior - not an error

---

### Issue 4: Key Not Rotating (Stuck on Same Key)
**Error:** Same key keeps being used, not trying next key

**Cause:** Key rotation loop not working

**Solution:**
1. Check browser console for "Fetching FRESH list" messages
2. Should see multiple "[Attempt X]" logs
3. If only one attempt, check if response is 200 (success stops loop)
4. If response is 429/401, check if key is marked as EXHAUSTED in database

**Debug:**
```typescript
// In enrichWithSmartRotation(), verify loop is running:
console.log(`\n🔎 [Attempt ${attempt}] Fetching FRESH list...`);
// Should see this multiple times if retrying
```

---

### Issue 5: Name Splitting Not Working
**Error:** `First='', Last='John Doe'` (reversed or wrong)

**Cause:** Name splitting logic in Rtne.tsx is wrong

**Solution:**
1. Check `bulkEnrichPhones()` in Rtne.tsx
2. Verify this code:
```typescript
const nameParts = row.full_name.trim().split(" ");
const firstName = nameParts[0];
const lastName = nameParts.slice(1).join(" ") || "";
```
3. Test with different name formats:
   - "John" → firstName="John", lastName=""
   - "John Doe" → firstName="John", lastName="Doe"
   - "John Doe Smith" → firstName="John", lastName="Doe Smith"

**Debug:**
```typescript
// Add this log in bulkEnrichPhones():
console.log(`Full Name: '${row.full_name}'`);
console.log(`Split: firstName='${firstName}', lastName='${lastName}'`);
```

---

### Issue 6: API Key Header Not Sent
**Error:** `401 Unauthorized` or `Invalid API Key`

**Cause:** API key header not being sent correctly

**Solution:**
1. Check `makeLushaApiCall()` headers:
```typescript
headers: {
  "api_key": apiKey,  // ← Must be lowercase "api_key"
  "Accept": "application/json",
}
```
2. Verify API key is not empty
3. Check API key format (should be long string)

**Debug:**
```typescript
// In makeLushaApiCall():
console.log(`🔑 Using API key ending in ...${apiKey.slice(-4)}`);
// Should show last 4 characters of key
```

---

### Issue 7: Response Not Parsing
**Error:** `Got 200 response but no contact data extracted`

**Cause:** Response format different than expected

**Solution:**
1. Check browser console for "Response Data:" log
2. Look at actual response structure
3. Update `parseLushaResponse()` if needed

**Debug:**
```typescript
// In makeLushaApiCall(), check response:
console.log(`📊 Response Data:`, data);
// Copy the structure and verify it matches parseLushaResponse() expectations
```

---

### Issue 8: Infinite Loop / Max Attempts Reached
**Error:** `Reached maximum 50 attempts. All keys have been tried.`

**Cause:** All keys returning 429/401, or loop not exiting on success

**Solution:**
1. Check if all keys are actually exhausted
2. Verify 200 response is being recognized
3. Check `parseLushaResponse()` is returning `success: true`

**Debug:**
```typescript
// In enrichWithSmartRotation():
console.log(`📡 Response Status: ${response.status}`);
// Should see 200 for successful responses
```

---

### Issue 9: Database Not Updating
**Error:** Key status not changing to EXHAUSTED/INVALID

**Cause:** Database update failing silently

**Solution:**
1. Check Supabase connection
2. Verify `lusha_api_keys` table exists
3. Check user has permission to update table
4. Look for errors in browser console

**Debug:**
```typescript
// In markKeyAsDead():
console.error(`❌ Error marking key as ${status}:`, error);
// Should show any database errors
```

---

### Issue 10: CORS Proxy Not Working
**Error:** `corsproxy.io` returns error or empty response

**Cause:** CORS proxy service down or URL malformed

**Solution:**
1. Test CORS proxy directly: `https://corsproxy.io/?https://example.com`
2. Check URL encoding is correct
3. Try alternative CORS proxy if needed

**Debug:**
```typescript
// Check the full proxied URL:
console.log(`🌐 Proxied URL: ${proxiedUrl}`);
// Copy and test in browser directly
```

---

## Debug Checklist

When troubleshooting, check these in order:

- [ ] **Browser Console**: Look for error messages and logs
- [ ] **Network Tab**: Check requests to `corsproxy.io` and their responses
- [ ] **Supabase**: Verify API keys table has active keys
- [ ] **API Key Format**: Ensure key is not empty and has correct format
- [ ] **Name Splitting**: Test with different name formats
- [ ] **Response Structure**: Check actual API response matches expected format
- [ ] **Database Permissions**: Verify user can update `lusha_api_keys` table
- [ ] **CORS Proxy**: Test proxy directly in browser

---

## Enabling Debug Mode

Add this to the top of `lushaService.ts` to enable extra logging:

```typescript
const DEBUG = true; // Set to false to disable

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}
```

Then use `debugLog()` instead of `console.log()` for verbose output.

---

## Getting Help

If you're stuck:

1. **Check the logs**: Browser console has detailed logs with emojis
2. **Check the network**: DevTools Network tab shows actual API calls
3. **Check the database**: Supabase shows key status updates
4. **Check the code**: Review the changes in `CHANGES_DETAILED.md`
5. **Test manually**: Try enriching a single row and watch the console

---

## Performance Tips

- **Slow enrichment?** Check if keys are being rotated (multiple attempts)
- **Many 429s?** Keys are exhausted, add more keys
- **Many 401s?** Keys are invalid, check key format
- **Timeout?** CORS proxy might be slow, try again

---

## Known Limitations

1. **CORS Proxy**: Depends on external service (`corsproxy.io`)
2. **Rate Limiting**: Lusha API has rate limits, may need to wait
3. **Profile Availability**: Not all profiles are in Lusha database
4. **Name Matching**: Name + Company matching is less accurate than LinkedIn URL
