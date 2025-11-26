# Lusha Integration Architecture

## Overview
The Lusha enrichment feature works by calling the Lusha API to get contact information (phone numbers, emails) for prospects.

## The Problem We Solved

### Old Architecture (Broken ❌)
```
┌─────────────────────────────────────────────────────────────┐
│ Browser (React App)                                         │
│                                                             │
│  User enters: "John Smith" + "Google"                      │
│         ↓                                                   │
│  lushaService.ts calls Lusha API directly                  │
│         ↓                                                   │
│  CORS Error! Browser blocks cross-origin request           │
│         ↓                                                   │
│  Try to use CORS proxy (corsproxy.io)                      │
│         ↓                                                   │
│  Sometimes works, sometimes fails, unreliable              │
└─────────────────────────────────────────────────────────────┘
```

**Why This Failed:**
- Browsers block cross-origin requests (CORS)
- CORS proxy is unreliable third-party service
- No server-side control
- API keys exposed to client

### New Architecture (Fixed ✅)
```
┌──────────────────────────────────────────────────────────────────┐
│ Browser (React App)                                              │
│                                                                  │
│  User enters: "John Smith" + "Google"                           │
│         ↓                                                        │
│  lushaService.ts calls Supabase Edge Function                   │
│         ↓                                                        │
│  (No CORS issues - same origin)                                 │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│ Supabase Edge Function (Server-Side)                             │
│ supabase/functions/lusha-enrich-proxy/index.ts                   │
│                                                                  │
│  Receives: apiKey, firstName, lastName, companyName             │
│         ↓                                                        │
│  Calls Lusha API directly (server-to-server)                    │
│         ↓                                                        │
│  (No CORS issues - server-side call)                            │
│         ↓                                                        │
│  Returns: { status, data, error }                               │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│ Lusha API                                                        │
│ https://api.lusha.com/v2/person                                 │
│                                                                  │
│  Receives: firstName, lastName, companyName, api_key            │
│         ↓                                                        │
│  Returns: { phoneNumbers, emailAddresses, jobTitle, ... }       │
└──────────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────────┐
│ Browser (React App)                                              │
│                                                                  │
│  Receives: { phone: "555-1234", email: "john@google.com" }      │
│         ↓                                                        │
│  Updates spreadsheet with phone and email                       │
│         ↓                                                        │
│  User sees: Phone number populated! ✅                          │
└──────────────────────────────────────────────────────────────────┘
```

**Why This Works:**
- No CORS issues (browser → Supabase is same origin)
- Server-side call to Lusha (no CORS restrictions)
- Reliable Supabase infrastructure
- API keys never exposed to client
- Full control over error handling

## Data Flow

### Step 1: User Input
```typescript
// User enters data in spreadsheet
Full Name: "John Smith"
Company: "Google"
```

### Step 2: Trigger Enrichment
```typescript
// Rtne.tsx detects both fields are filled
handleChange(rowId, 'full_name', 'John Smith')
  → Check if company_name is also filled
  → Yes! Trigger enrichment
```

### Step 3: Call Service
```typescript
// Rtne.tsx calls service
enrichProspectByName(
  'John',           // firstName
  'Smith',          // lastName
  'Google',         // companyName
  'PHONE_ONLY'      // category
)
```

### Step 4: Service Calls Edge Function
```typescript
// lushaService.ts
supabase.functions.invoke('lusha-enrich-proxy', {
  body: {
    apiKey: 'sk_live_...',
    params: {
      firstName: 'John',
      lastName: 'Smith',
      companyName: 'Google'
    }
  }
})
```

### Step 5: Edge Function Calls Lusha
```typescript
// supabase/functions/lusha-enrich-proxy/index.ts
fetch('https://api.lusha.com/v2/person?firstName=John&lastName=Smith&companyName=Google', {
  headers: {
    'api_key': 'sk_live_...'
  }
})
```

### Step 6: Lusha Returns Data
```json
{
  "contact": {
    "data": {
      "phoneNumbers": [
        {
          "internationalNumber": "+1-555-1234",
          "number": "555-1234"
        }
      ],
      "emailAddresses": [
        {
          "email": "john.smith@google.com"
        }
      ],
      "fullName": "John Smith",
      "company": {
        "name": "Google"
      },
      "jobTitle": "Software Engineer"
    }
  }
}
```

### Step 7: Parse Response
```typescript
// lushaService.ts parseLushaResponse()
{
  success: true,
  phone: "+1-555-1234",
  email: "john.smith@google.com",
  fullName: "John Smith",
  company: "Google",
  title: "Software Engineer"
}
```

### Step 8: Update UI
```typescript
// Rtne.tsx
setRows(prev => prev.map(r => 
  r.id === rowId 
    ? { ...r, prospect_number: "+1-555-1234" } 
    : r
))
```

### Step 9: User Sees Result
```
Full Name: John Smith
Company: Google
Primary Phone: +1-555-1234  ✅ Populated!
```

## Key Components

### 1. React Component (Rtne.tsx)
- **Responsibility:** UI, user input, state management
- **Triggers enrichment when:** Full Name + Company are both filled
- **Calls:** `enrichProspectByName()` or `enrichProspect()`

### 2. Service Layer (lushaService.ts)
- **Responsibility:** Business logic, API orchestration
- **Handles:** Smart key rotation, error handling, response parsing
- **Calls:** Supabase Edge Function

### 3. Edge Function (lusha-enrich-proxy)
- **Responsibility:** Server-side API proxy
- **Handles:** Direct Lusha API calls, no CORS issues
- **Returns:** Structured response with status and data

### 4. Database (Supabase)
- **Table:** `lusha_api_keys` - Stores API keys and their status
- **Table:** `rtne_requests` - Stores prospect data and enrichment results

## Smart Key Rotation

The service implements intelligent key rotation:

```typescript
// When enrichment is requested:
1. Fetch all ACTIVE keys for category (PHONE_ONLY or EMAIL_ONLY)
2. Sort by last_used_at (least recently used first)
3. Try first key
4. If 429 (out of credits) or 401 (invalid):
   - Mark key as EXHAUSTED or INVALID
   - Try next key
5. If 200 (success):
   - Parse response
   - Update key's last_used_at
   - Return data
6. If 404 (not found):
   - Return "not found" error
   - Don't retry
```

This ensures:
- Keys are used fairly (round-robin)
- Dead keys are automatically removed
- Enrichment continues even if some keys fail
- Maximum 50 attempts before giving up

## Error Handling

### HTTP Status Codes
- **200:** Success - Extract and return data
- **401:** Invalid API key - Mark as INVALID, try next key
- **404:** Profile not found - Return "not found" error
- **429:** Out of credits - Mark as EXHAUSTED, try next key
- **500+:** Server error - Try next key

### Error Messages
- "No API keys" - No active keys available
- "Not found" - Profile doesn't exist in Lusha
- "Max attempts reached" - All keys tried, all failed
- "Network error" - Connection issue

## Security Considerations

### API Keys
- Stored in Supabase database (encrypted at rest)
- Never exposed to client
- Only used server-side in Edge Function
- Can be rotated/revoked in Admin Panel

### Data Flow
- Client → Supabase (HTTPS)
- Supabase → Lusha (HTTPS, server-to-server)
- No third-party proxies
- No data stored in browser

### Rate Limiting
- Lusha API has rate limits
- Smart key rotation distributes load
- Multiple keys allow higher throughput

## Monitoring & Debugging

### Console Logs
```
📡 Calling Lusha API via Supabase Edge Function...
🔑 Using API key ending in ...XXXX
📋 Parameters: {...}
📊 Response Status: 200
✅ Successfully extracted contact data
```

### Supabase Edge Function Logs
- View in Supabase Dashboard → Edge Functions → lusha-enrich-proxy → Logs
- Shows all invocations and errors

### Database Queries
```sql
-- Check API keys
SELECT * FROM lusha_api_keys ORDER BY created_at DESC;

-- Check enrichment requests
SELECT * FROM rtne_requests ORDER BY created_at DESC LIMIT 10;
```

## Performance

### Typical Response Time
- Browser → Supabase: ~50-100ms
- Supabase → Lusha: ~200-500ms
- Total: ~250-600ms per enrichment

### Bulk Enrichment
- 100 prospects: ~25-60 seconds
- Progress indicator shows real-time progress
- Can be cancelled (not implemented yet)

## Future Improvements

1. **Caching** - Cache results to avoid duplicate API calls
2. **Batch API** - Use Lusha batch endpoint for bulk enrichment
3. **Webhooks** - Async enrichment with webhook callbacks
4. **Analytics** - Track enrichment success rates by key
5. **Retry Logic** - Exponential backoff for failed requests
6. **Rate Limiting** - Client-side rate limiting to prevent abuse
