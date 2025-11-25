# System Architecture & Data Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RTNE Frontend (React)                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Spreadsheet Table Component                 │   │
│  │                                                           │   │
│  │  ┌─────────────┬──────────────┬──────────────────────┐   │   │
│  │  │ Full Name   │ Company Name │ LinkedIn Profile URL │   │   │
│  │  │ (Editable)  │ (Editable)   │ (Editable)          │   │   │
│  │  └─────────────┴──────────────┴──────────────────────┘   │   │
│  │                                                           │   │
│  │  ┌─────────────┬──────────────┬──────────────────────┐   │   │
│  │  │ Primary Ph  │ Phone 2      │ Phone 3             │   │   │
│  │  │ (Auto-fill) │ (Auto-fill)  │ (Auto-fill)         │   │   │
│  │  └─────────────┴──────────────┴──────────────────────┘   │   │
│  │                                                           │   │
│  │  ┌─────────────┬──────────────┬──────────────────────┐   │   │
│  │  │ Phone 4     │ Email        │ City                │   │   │
│  │  │ (Auto-fill) │ (Auto-fill)  │ (Editable)          │   │   │
│  │  └─────────────┴──────────────┴──────────────────────┘   │   │
│  │                                                           │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Job Title (Editable)                             │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Enrichment Logic (handleChange)             │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ Condition A: LinkedIn URL Enrichment           │    │   │
│  │  │ - Validate LinkedIn URL                        │    │   │
│  │  │ - Call enrichProspect(url, "PHONE_ONLY")       │    │   │
│  │  │ - Call enrichProspect(url, "EMAIL_ONLY")       │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │ Condition B: Name + Company Enrichment         │    │   │
│  │  │ - Check Full Name AND Company filled           │    │   │
│  │  │ - Split Full Name (splitFullName)              │    │   │
│  │  │ - Call enrichProspectByName(..., "PHONE_ONLY") │    │   │
│  │  │ - Call enrichProspectByName(..., "EMAIL_ONLY") │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              State Management                            │   │
│  │                                                           │   │
│  │  - enrichmentTriggeredRef: Track enriched rows          │   │
│  │  - enrichingRows: Track currently enriching rows        │   │
│  │  - rows: Main data state                               │   │
│  │  - selectedCell: Current cell selection                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              UI Feedback                                 │   │
│  │                                                           │   │
│  │  - "Enriching..." spinner                               │   │
│  │  - Toast notifications (success/error)                  │   │
│  │  - Real-time status updates                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              lusha-enrich Function                       │   │
│  │                                                           │   │
│  │  Input:                                                  │   │
│  │  - linkedinUrl (optional)                               │   │
│  │  - firstName, lastName, companyName (optional)          │   │
│  │  - category: "PHONE_ONLY" | "EMAIL_ONLY"               │   │
│  │                                                           │   │
│  │  Output:                                                 │   │
│  │  - success: boolean                                      │   │
│  │  - phone?: string                                        │   │
│  │  - email?: string                                        │   │
│  │  - error?: string                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Lusha API                                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Enrichment Service                                      │   │
│  │                                                           │   │
│  │  - Phone Lookup API                                      │   │
│  │  - Email Lookup API                                      │   │
│  │  - Name + Company Search                                 │   │
│  │  - LinkedIn Profile Parsing                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                             │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  rtne_requests Table                                     │   │
│  │                                                           │   │
│  │  - id (UUID)                                             │   │
│  │  - user_id                                               │   │
│  │  - project_name                                          │   │
│  │  - full_name                                             │   │
│  │  - company_name                                          │   │
│  │  - linkedin_url                                          │   │
│  │  - primary_phone                                         │   │
│  │  - email_address                                         │   │
│  │  - city                                                  │   │
│  │  - job_title                                             │   │
│  │  - status                                                │   │
│  │  - created_at / updated_at                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: LinkedIn URL Enrichment

```
User Action
    ↓
Paste LinkedIn URL in prospect_linkedin field
    ↓
handleChange() triggered
    ↓
Validate LinkedIn URL format
    ↓
Check: URL valid? AND not already enriched? AND no phone/email?
    ↓ YES
Set enrichingRows state (show spinner)
    ↓
Call enrichProspect(url, "PHONE_ONLY")
    ↓
Supabase Edge Function → Lusha API
    ↓
Phone data returned?
    ├─ YES → Update prospect_number field
    │         Show success toast
    └─ NO → Continue
    ↓
Call enrichProspect(url, "EMAIL_ONLY")
    ↓
Supabase Edge Function → Lusha API
    ↓
Email data returned?
    ├─ YES → Update prospect_email field
    │         Show success toast
    └─ NO → Show "No enrichment data found"
    ↓
Clear enrichingRows state (hide spinner)
    ↓
Auto-save to Supabase (debounced 1 sec)
    ↓
Mark row as enriched (enrichmentTriggeredRef)
```

### Flow 2: Name + Company Enrichment

```
User Action
    ↓
Enter "John Smith" in full_name field
    ↓
handleChange() triggered
    ↓
Check: Company filled? AND not already enriched? AND no LinkedIn URL?
    ↓ NO → Continue to next action
    ↓
User enters "Google" in company_name field
    ↓
handleChange() triggered
    ↓
Check: Full Name filled? AND Company filled? AND not enriched?
    ↓ YES
Set enrichingRows state (show spinner)
    ↓
Split Full Name: "John Smith" → firstName: "John", lastName: "Smith"
    ↓
Call enrichProspectByName("John", "Smith", "Google", "PHONE_ONLY")
    ↓
Supabase Edge Function → Lusha API
    ↓
Phone data returned?
    ├─ YES → Update prospect_number field
    │         Show success toast
    └─ NO → Continue
    ↓
Call enrichProspectByName("John", "Smith", "Google", "EMAIL_ONLY")
    ↓
Supabase Edge Function → Lusha API
    ↓
Email data returned?
    ├─ YES → Update prospect_email field
    │         Show success toast
    └─ NO → Show "No enrichment data found"
    ↓
Clear enrichingRows state (hide spinner)
    ↓
Auto-save to Supabase (debounced 1 sec)
    ↓
Mark row as enriched (enrichmentTriggeredRef)
```

---

## Component Hierarchy

```
Rtne (Main Page Component)
├── Header
│   ├── Navigation
│   ├── Toolbar
│   └── Action Buttons
├── Main Content
│   ├── Spreadsheet Table
│   │   ├── TableHead
│   │   │   └── HeaderRow
│   │   │       ├── RowNumber Header
│   │   │       ├── Full Name Header
│   │   │       ├── Company Name Header
│   │   │       ├── LinkedIn URL Header
│   │   │       ├── Phone Headers (4)
│   │   │       ├── Email Header
│   │   │       ├── City Header
│   │   │       └── Job Title Header
│   │   └── TableBody
│   │       └── DataRows (100+)
│   │           ├── RowNumber Cell
│   │           ├── Full Name Cell (Input)
│   │           ├── Company Name Cell (Input)
│   │           ├── LinkedIn URL Cell (Input)
│   │           ├── Phone Cells (4, Auto-fill)
│   │           ├── Email Cell (Auto-fill)
│   │           ├── City Cell (Input)
│   │           └── Job Title Cell (Input)
│   └── ContextMenu
│       ├── Insert Row Above
│       ├── Insert Row Below
│       ├── Delete Row
│       ├── Clear Row
│       ├── Copy Row
│       ├── Cut Row
│       └── Paste Row
└── Footer
    └── Status Bar
```

---

## State Management

```
Component State:
├── rows: RtneRow[]
│   └── Each row contains:
│       ├── id: number
│       ├── prospect_linkedin: string
│       ├── full_name: string
│       ├── company_name: string
│       ├── prospect_number: string
│       ├── prospect_email: string
│       ├── prospect_city: string
│       ├── prospect_designation: string
│       ├── status: 'ready' | 'pending' | 'processing' | 'completed' | 'failed'
│       └── supabaseId: string (UUID)
│
├── enrichingRows: Set<number>
│   └── Tracks which rows are currently enriching
│
├── selectedCell: {rowId: number, field: keyof RtneRow} | null
│   └── Currently selected cell for editing
│
├── selectedCells: Set<string>
│   └── Multi-cell selection for bulk operations
│
├── isEditing: boolean
│   └── Whether in edit mode
│
├── contextMenu: {isOpen: boolean, position: {x, y}, rowId: number}
│   └── Context menu state
│
└── Refs:
    ├── enrichmentTriggeredRef: Set<number>
    │   └── Tracks which rows have been enriched
    │
    ├── saveTimeoutRef: {[key: string]: NodeJS.Timeout}
    │   └── Debounce timers for auto-save
    │
    └── nextIdRef: number
        └── Next row ID to assign
```

---

## API Integration

### Supabase Edge Function: lusha-enrich

**Request:**
```typescript
{
  // Method 1: LinkedIn URL
  linkedinUrl: string,
  category: "PHONE_ONLY" | "EMAIL_ONLY",
  
  // Method 2: Name + Company
  firstName: string,
  lastName: string,
  companyName: string,
  category: "PHONE_ONLY" | "EMAIL_ONLY",
  
  // Optional
  masterProspectId?: string
}
```

**Response:**
```typescript
{
  success: boolean,
  phone?: string | null,
  email?: string | null,
  fullName?: string | null,
  company?: string | null,
  title?: string | null,
  error?: string,
  message?: string,
  rawData?: any
}
```

---

## Error Handling Flow

```
API Call
    ↓
Response received?
├─ NO → Network Error
│       ├─ Log to console
│       ├─ Show error toast
│       └─ Allow retry
│
└─ YES → Parse response
         ↓
         success: true?
         ├─ YES → Extract data
         │        ├─ Phone found? → Update field
         │        ├─ Email found? → Update field
         │        └─ Show success toast
         │
         └─ NO → API Error
                 ├─ Log error details
                 ├─ Show error toast
                 └─ Allow retry
```

---

## Performance Optimization

### Debouncing
```
User types in cell
    ↓
handleChange() called
    ↓
Clear previous timeout
    ↓
Set new timeout (1 second)
    ↓
1 second passes without new input
    ↓
Save to Supabase
```

### Duplicate Prevention
```
Enrichment triggered
    ↓
Check enrichmentTriggeredRef
    ├─ Row already enriched? → Skip
    └─ Row not enriched? → Proceed
    ↓
Add row to enrichmentTriggeredRef
    ↓
Perform enrichment
    ↓
Keep row in enrichmentTriggeredRef
    ↓
User can manually clear row to re-trigger
```

---

## Security Considerations

```
User Input
    ↓
Validate format
├─ LinkedIn URL: Validate URL pattern
├─ Full Name: Trim whitespace
├─ Company Name: Trim whitespace
└─ Other fields: Trim whitespace
    ↓
Sanitize for API
├─ Remove special characters if needed
├─ Encode for transmission
└─ Validate length
    ↓
Send to Supabase
    ├─ HTTPS encryption
    ├─ Authentication required
    └─ Row-level security
    ↓
Supabase Edge Function
    ├─ Validate user permissions
    ├─ Rate limiting
    └─ API key management
    ↓
Lusha API
    ├─ API key authentication
    ├─ Request validation
    └─ Response validation
```

---

## Scalability Considerations

### Current Limits
- 100 rows per page (configurable)
- 1 second debounce for saves
- Sequential API calls (not parallel)
- Single user per session

### Future Improvements
- Pagination for large datasets
- Batch API calls
- Parallel enrichment
- Multi-user collaboration
- Caching layer
- Rate limiting

---

## Monitoring & Logging

```
Events Logged:
├── User Actions
│   ├── Cell edited
│   ├── Row inserted
│   ├── Row deleted
│   └── Row cleared
│
├── Enrichment Events
│   ├── Enrichment started
│   ├── API call made
│   ├── Data received
│   ├── Data updated
│   └── Enrichment completed
│
├── Error Events
│   ├── API error
│   ├── Network error
│   ├── Validation error
│   └── Database error
│
└── Performance Events
    ├── Page load time
    ├── Enrichment time
    ├── Save time
    └── API response time
```

---

**Last Updated:** November 25, 2025  
**Version:** 1.0.0
