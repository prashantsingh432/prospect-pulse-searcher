# Root Cause Diagnosis - API Test Failing

## The Problem
"Tried 50 times but all keys are exhausted or invalid" - but the key is valid and has credits.

## Root Cause Found ✅

### Issue #1: WRONG API ENDPOINT ❌
**Current Code:**
```typescript
const lushaUrl = new URL("https://api.lusha.com/v2/person");
```

**Problem:** This is using the OLD/DEPRECATED endpoint for GET requests with query parameters.

**Correct Endpoint:**
```
POST https://api.lusha.com/person/contact
```

Lusha API changed their endpoint structure. The correct endpoint for contact enrichment is:
- **POST** (not GET)
- **`/person/contact`** (not `/v2/person`)

### Issue #2: WRONG HTTP METHOD ❌
**Current Code:**
```typescript
const lushaResponse = await fetch(lushaUrl.toString(), {
  method: "GET",  // ❌ WRONG
  headers: {
    "api_key": apiKey,
    "Content-Type": "application/json",
  },
});
```

**Problem:** Using GET with query parameters. Lusha API expects POST with JSON body.

**Correct Method:**
```typescript
const lushaResponse = await fetch("https://api.lusha.com/person/contact", {
  method: "POST",  // ✅ CORRECT
  headers: {
    "Authorization": apiKey,  // ✅ CORRECT header name
    "Content-Type": "application/json",
  },
  body: JSON.stringify({...})  // ✅ Send as JSON body
});
```

### Issue #3: WRONG HEADER NAME ❌
**Current Code:**
```typescript
headers: {
  "api_key": apiKey,  // ❌ WRONG
  "Content-Type": "application/json",
}
```

**Problem:** Using `api_key` header. Lusha API expects `Authorization` header.

**Correct Header:**
```typescript
headers: {
  "Authorization": apiKey,  // ✅ CORRECT
  "Content-Type": "application/json",
}
```

### Issue #4: WRONG REQUEST BODY FORMAT ❌
**Current Code:**
```typescript
// Sending as URL query parameters (GET request)
lushaUrl.searchParams.append("firstName", params.firstName);
lushaUrl.searchParams.append("lastName", params.lastName);
lushaUrl.searchParams.append("companyName", params.companyName);
```

**Problem:** Query parameters don't work with POST. Need JSON body.

**Correct Format:**
```typescript
const body = {
  firstName: params.firstName,
  lastName: params.lastName,
  company: params.companyName,  // Note: "company" not "companyName"
  revealPhones: true,
  revealEmails: true
};

const lushaResponse = await fetch("https://api.lusha.com/person/contact", {
  method: "POST",
  headers: {
    "Authorization": apiKey,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body)
});
```

### Issue #5: WRONG FIELD NAMES ❌
**Current Code:**
```typescript
companyName: params.companyName  // ❌ WRONG field name
```

**Correct Field Names:**
```typescript
{
  firstName: "Purvi",
  lastName: "Shah",
  company: "Green Rootz",  // ✅ "company" not "companyName"
  revealPhones: true,
  revealEmails: true
}
```

### Issue #6: RETRY LOGIC PROBLEM ❌
**Current Code:**
```typescript
// Retries 50 times, marking key as "EXHAUSTED" after first failure
if (response.status === 429) {
  await markKeyAsDead(key.id, "EXHAUSTED");
  continue;
}
```

**Problem:** 
- Retries 50 times even for non-retryable errors
- Marks key as EXHAUSTED on first error
- Doesn't show the real error from Lusha

**Correct Logic:**
- Try 1-2 times max
- Only retry on 429 (rate limit) or 401 (invalid key)
- Show real error message from Lusha
- Don't mark key as dead on first try

## Summary of Issues

| Issue | Current | Correct | Impact |
|-------|---------|---------|--------|
| Endpoint | `/v2/person` (GET) | `/person/contact` (POST) | ❌ API rejects request |
| Method | GET | POST | ❌ API rejects request |
| Header | `api_key` | `Authorization` | ❌ API rejects request |
| Body | URL query params | JSON body | ❌ API rejects request |
| Field | `companyName` | `company` | ❌ API rejects request |
| Retry | 50 times | 1-2 times | ❌ Wastes time, marks key dead |

## Why "Last Used = Never"
The request never reaches Lusha API because:
1. ❌ Wrong endpoint
2. ❌ Wrong HTTP method
3. ❌ Wrong header name
4. ❌ Wrong request format

Lusha API rejects the request immediately, so it never records "Last Used".

## The Fix
Update the Edge Function to use:
- ✅ Correct endpoint: `POST https://api.lusha.com/person/contact`
- ✅ Correct method: POST
- ✅ Correct header: `Authorization: <API_KEY>`
- ✅ Correct body: JSON with firstName, lastName, company
- ✅ Correct retry logic: 1-2 tries max
- ✅ Show real error messages

## Test After Fix
```
Input:
- First Name: Purvi
- Last Name: Shah
- Company: Green Rootz
- API Key: a0864724-60f4-4e7b-9253-ahf7c37c19c6

Expected Result:
✅ Success - Phone and/or Email populated
✅ Last Used: [current timestamp]
✅ Credits: [decremented by 1]
```
