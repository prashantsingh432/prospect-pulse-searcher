# Quick Deployment Guide

## Step 1: Deploy Edge Function

### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** in the sidebar
3. Click **Create a new function**
4. Name it: `create-disposition`
5. Copy the contents of `supabase/functions/create-disposition/index.ts`
6. Paste into the editor and click **Deploy**

### Option B: Using Supabase CLI (if available)
```bash
supabase functions deploy create-disposition
```

## Step 2: Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the sidebar
3. Copy the contents of `manual_migration.sql`
4. Paste into the SQL editor and click **Run**

## Step 3: Test the Implementation

### Quick Test in Browser Console:
1. Open your app at http://localhost:8080
2. Login as any user
3. Open browser developer tools (F12)
4. Go to Console tab
5. Copy and paste the contents of `test_edge_function.js`
6. Press Enter to run the test

### Manual Test:
1. Login to your app
2. Navigate to any prospect
3. Add a disposition (select any type)
4. Check the disposition history
5. Verify it shows your actual name and project instead of "Unknown Agent (Project: N/A)"

## Step 4: Verify Results

After testing, the disposition history should show:
- **Before**: "Unknown Agent (Project: N/A)"
- **After**: "Your Name (Project: Your Project)"

## Troubleshooting

### Edge Function Not Found
- Verify the function was deployed successfully
- Check the function name is exactly `create-disposition`
- Ensure the function is enabled in Supabase dashboard

### Still Showing Unknown Agent
- Check browser console for errors
- Verify the migration was run successfully
- Check that your user exists in the `users` table

### Permission Errors
- Verify RLS policies are in place
- Check that the user is properly authenticated
- Ensure the edge function has the correct environment variables

## Environment Variables Required

The edge function needs these environment variables (should be automatically available):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

These are automatically provided by Supabase for edge functions.

## Success Criteria

✅ Edge function deployed successfully  
✅ Database migration completed without errors  
✅ Test disposition shows correct user name and project  
✅ No console errors when creating dispositions  
✅ Disposition history displays properly formatted user info
