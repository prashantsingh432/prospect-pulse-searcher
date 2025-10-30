# Run Database Migration for Additional Phone Columns

## What This Does
Adds 3 additional phone number columns (phone_2, phone_3, phone_4) to the rtne_requests table so RTNP can enter multiple phone numbers for each contact.

## How to Run

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this SQL:

```sql
-- Add additional phone number columns to rtne_requests table
ALTER TABLE rtne_requests
ADD COLUMN IF NOT EXISTS phone_2 TEXT,
ADD COLUMN IF NOT EXISTS phone_3 TEXT,
ADD COLUMN IF NOT EXISTS phone_4 TEXT;

-- Add comments for documentation
COMMENT ON COLUMN rtne_requests.primary_phone IS 'Primary contact phone number';
COMMENT ON COLUMN rtne_requests.phone_2 IS 'Secondary contact phone number';
COMMENT ON COLUMN rtne_requests.phone_3 IS 'Tertiary contact phone number';
COMMENT ON COLUMN rtne_requests.phone_4 IS 'Quaternary contact phone number';
```

5. Click "Run" button
6. You should see "Success. No rows returned"

### Option 2: Supabase CLI
If you have Supabase CLI installed:

```bash
supabase db push
```

This will apply all pending migrations including the new one.

## Verify Migration

Run this query to verify the columns were added:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rtne_requests' 
AND column_name LIKE '%phone%';
```

You should see:
- primary_phone
- phone_2
- phone_3
- phone_4

## After Migration

1. Refresh your browser (Ctrl + Shift + R)
2. Login as RTNP user
3. Click on any project
4. You'll now see 4 phone number columns:
   - Phone 1 (primary_phone)
   - Phone 2
   - Phone 3
   - Phone 4

All positioned right after the LinkedIn URL column for easy access!

## Column Order

The new column order is:
1. Row #
2. User
3. Status
4. LinkedIn Profile URL
5. **Phone 1** ← First priority
6. **Phone 2** ← Additional numbers
7. **Phone 3** ← Additional numbers
8. **Phone 4** ← Additional numbers
9. Full Name
10. City
11. Job Title
12. Company Name
13. Email Address
14. Action

This way, RTNP can quickly fill in all available phone numbers right after seeing the LinkedIn URL!
