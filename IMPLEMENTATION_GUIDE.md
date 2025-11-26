# Lusha Service Rewrite - Implementation Guide

## What Changed

### The Problem
Your Python script works perfectly with smart key rotation, but the React app was failing because:
1. Edge Function intermediary added complexity
2. Name splitting logic was inconsistent
3. CORS errors on localhost
4. Key rotation wasn't re-fetching fresh keys on each iteration

### The Solution
Complete rewrite of `lushaService.ts` to:
1. Make direct HTTP calls to Lusha API
2. Wrap URLs with CORS proxy (`corsproxy.io`)
3. Move name splitting to frontend (Rtne.tsx)
4. Implement exact Python loop logic with re-fetching

---

## Code Flow

### 1. User Clicks "Enrich Phones" Button
```
Rtne.tsx: bulkEnrichPhones()
  ↓
For each row:
  - Split full_name into firstName + lastName
  - Call enrichProspectByName(firstName, lastName, company, "PHONE_ONLY")
```

### 2. Service Receives Request
```
lushaService.ts: enrichProspectByName()
  ↓
Call enrichWithSmartRotation() with params
```

### 3. Smart Rotation Loop (Python-Mirrored)
```
enrichWithSmartRotation()
  ↓
Loop (max 50 attempts):
  1. Fetch FRESH list of ACTIVE keys from Supabase
  2. Get first key (least recently used)
  3. Call makeLushaApiCall(key, params)
  4. Check response status:
     - 429: Mark EXHAUSTED, continue loop
     - 401: Mark INVALID, continue loop
     - 404: Return "not found"
     - 200: Parse data, update last_used_at, return result
     - Other: Continue loop
```

### 4. Direct HTTP Call
```
makeLushaApiCall()
  ↓
Build URL: https://api.lusha.com/v2/person?firstName=...&lastName=...&companyName=...
  ↓
Wrap with CORS proxy: https://corsproxy.io/?https://api.lusha.com/v2/person?...
  ↓
fetch(proxiedUrl, {
  method: "GET",
  headers: {
    "api_key": apiKey,
    "Accept": "application/json"
  }
})
  ↓
Return { status, data, error }
```

### 5. Response Handling
```
If 200 OK:
  - Parse response with parseLushaResponse()
  - Extract phone/email/name/company/title
  - Update key's last_used_at timestamp
  - Return success result
  
If 429/401:
  - Mark key as EXHAUSTED/INVALID in database
  - Loop back to step 1 (fetch fresh keys)
  
If 404:
  - Return "not found" (don't retry)
  
If other:
  - Continue to next key
```

---

## Key Implementation Details

### CORS Proxy Wrapping
```typescript
const CORS_PROXY = "https://corsproxy.io/?";
const LUSHA_API_BASE = "https://api.lusha.com/v2/person";

// Example construction:
const apiUrl = "https://api.lusha.com/v2/person?firstName=John&lastName=Doe&companyName=Acme";
const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
// Result: https://corsproxy.io/?https%3A%2F%2Fapi.lusha.com%2Fv2%2Fperson%3FfirstName%3DJohn...
```

### Name Splitting (Frontend)
```typescript
// In Rtne.tsx
const nameParts = row.full_name.trim().split(" ");
const firstName = nameParts[0];                    // "John"
const lastName = nameParts.slice(1).join(" ") || ""; // "Doe Smith" or ""

// Handles:
// "John" → firstName="John", lastName=""
// "John Doe" → firstName="John", lastName="Doe"
// "John Doe Smith" → firstName="John", lastName="Doe Smith"
```

### Key Rotation (Service)
```typescript
// Re-fetch on EVERY iteration
while (attempt < MAX_ATTEMPTS) {
  const keys = await getActiveKeysForCategory(category); // Fresh fetch!
  
  if (keys.length === 0) {
    return { success: false, error: "No API keys" };
  }
  
  const key = keys[0]; // Least recently used (ordered by last_used_at ASC)
  
  // Try this key...
  const response = await makeLushaApiCall(key.key_value, params);
  
  // If 429/401: Mark dead and continue (loop back to re-fetch)
  // If 200: Success!
  // If 404: Not found (don't retry)
}
```

---

## Testing the Implementation

### Test 1: LinkedIn URL Enrichment
```
1. Add a row with LinkedIn URL
2. Click "Enrich Phones"
3. Check browser console for:
   - "Making direct HTTP call to Lusha API..."
   - "Proxied URL: https://corsproxy.io/?..."
   - "Response Status: 200"
   - "Successfully extracted contact data"
4. Verify phone number appears in row
```

### Test 2: Name + Company Enrichment
```
1. Add a row with Full Name and Company Name
2. Click "Enrich Emails"
3. Check browser console for:
   - "Enriching: First='John', Last='Doe', Company='Acme'"
   - "Making direct HTTP call to Lusha API..."
   - "Response Status: 200"
4. Verify email appears in row
```

### Test 3: Key Rotation (429 Response)
```
1. Use a key with 0 credits (will return 429)
2. Click "Enrich Phones"
3. Check browser console for:
   - "Key (...XXXX) is OUT OF CREDITS (HTTP 429)"
   - "Marked as EXHAUSTED. Retrying with next key..."
   - "[Attempt 2] Fetching FRESH list of active PHONE_ONLY keys..."
   - Next key is tried
4. Verify database shows first key as EXHAUSTED
```

### Test 4: Single-Word Names
```
1. Add row with Full Name = "Cher"
2. Click "Enrich Phones"
3. Check console for:
   - "Enriching: First='Cher', Last='', Company='...'"
4. Verify enrichment works with empty lastName
```

---

## Debugging Checklist

- [ ] **CORS Errors?** Check that URL is wrapped with `corsproxy.io/?`
- [ ] **No Response?** Check network tab for `corsproxy.io` requests
- [ ] **Wrong Data?** Check `parseLushaResponse()` is extracting correct fields
- [ ] **Key Not Rotating?** Check console for "Fetching FRESH list" messages
- [ ] **Key Not Marked Dead?** Check Supabase `lusha_api_keys` table for status updates
- [ ] **Name Splitting Wrong?** Check console logs in `bulkEnrichPhones()`
- [ ] **Infinite Loop?** Check MAX_ATTEMPTS limit (50) is being enforced

---

## Files to Review

1. **src/services/lushaService.ts** - Main service with smart rotation
2. **src/pages/Rtne.tsx** - Frontend name splitting and enrichment triggers
3. **LUSHA_REWRITE_SUMMARY.md** - Detailed change summary

---

## Next Steps

1. Test all enrichment scenarios
2. Monitor console logs for any errors
3. Check Supabase for key status updates
4. Verify CORS proxy is working (check network tab)
5. If issues, check the debugging checklist above
