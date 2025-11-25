# RTNE Smart Enrichment - Complete Implementation Guide

## Overview
The RTNE (Real-Time Number Enrichment) spreadsheet now includes intelligent Name + Company enrichment that automatically fills in prospect data as you type.

## How It Works

### Trigger Logic
The enrichment is triggered when:
1. User enters a **Full Name** (e.g., "Nishtha Gupta")
2. User enters a **Company Name** (e.g., "Axis Bank")
3. Both fields are filled in the same row
4. The row hasn't been enriched before

### Automatic Data Population
Once triggered, the system automatically fills:
- **Phone Number** (Primary Phone field)
- **Email Address** (Email Address field)
- **City** (City field) - if available
- **Job Title** (Job Title field) - if available

### Visual Feedback
- **Enriching Status**: Shows "Enriching..." with a spinner in the Status column
- **Success Toast**: Brief notification when data is found
- **Error Toast**: Notification if no data found or API fails
- **Row Highlighting**: The row being enriched is highlighted

## Step-by-Step Usage

### 1. Open RTNE Page
- Navigate to the RTNE page from the dashboard
- You'll see a spreadsheet with 100 empty rows

### 2. Enter Prospect Information
- Click on the **Full Name** column in any row
- Type the prospect's full name (e.g., "John Smith")
- Press Tab or Enter to move to the next field

### 3. Enter Company Name
- Click on the **Company Name** column in the same row
- Type the company name (e.g., "Acme Corporation")
- Press Tab or Enter

### 4. Automatic Enrichment Triggers
- Once both Full Name and Company Name are filled, enrichment starts automatically
- You'll see "Enriching..." in the Status column
- The system will fetch phone and email data

### 5. Review Enriched Data
- Phone number appears in the **Primary Phone** column
- Email appears in the **Email Address** column
- City and Job Title populate if available
- Status changes to show completion

## Column Reference

| Column | Purpose | Editable | Auto-Filled |
|--------|---------|----------|-------------|
| # | Row number | No | Auto |
| LinkedIn Profile URL | LinkedIn URL | Yes | No |
| Primary Phone | Phone number | Yes | Yes (via enrichment) |
| Phone 2 | Secondary phone | Yes | No |
| Phone 3 | Tertiary phone | Yes | No |
| Phone 4 | Quaternary phone | Yes | No |
| Email Address | Email | Yes | Yes (via enrichment) |
| Status | Enrichment status | No | Auto |
| Full Name | Prospect name | Yes | No |
| City | Location | Yes | Yes (via enrichment) |
| Job Title | Position | Yes | Yes (via enrichment) |
| Company Name | Organization | Yes | No |

## Name Splitting Logic

The system automatically splits full names:

**Examples:**
- "Nishtha Gupta" → firstName: "Nishtha", lastName: "Gupta"
- "John Smith Jr" → firstName: "John", lastName: "Smith Jr"
- "Cher" → firstName: "Cher", lastName: "" (single word)
- "Maria Garcia Lopez" → firstName: "Maria", lastName: "Garcia Lopez"

**Rule:** Split at the first space only. Everything before = firstName, everything after = lastName.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Move to next cell |
| Shift + Tab | Move to previous cell |
| Enter | Move down to next row |
| Shift + Enter | Move up to previous row |
| F2 | Edit current cell |
| Escape | Cancel editing |
| Ctrl+C | Copy selected cells |
| Ctrl+X | Cut selected cells |
| Ctrl+V | Paste cells |
| Delete | Clear selected cells |

## Bulk Operations

### Add Multiple Rows
1. Enter the number of rows in the input field at the bottom
2. Click "Add rows" button
3. Or use quick buttons: "+100" or "+1000"

### Copy/Paste Data
1. Select cells with Ctrl+C
2. Click on destination cell
3. Paste with Ctrl+V
4. Data auto-saves after 1 second

### Multi-Cell Selection
1. Click on a cell
2. Hold Shift and click another cell to select range
3. Use Ctrl+C to copy, Ctrl+X to cut, Ctrl+V to paste

## Data Persistence

- All changes auto-save to Supabase after 1 second of inactivity
- No manual save button needed
- Data persists across browser sessions
- Each row is tracked with a unique ID

## Enrichment Status Indicators

| Status | Meaning | Action |
|--------|---------|--------|
| Enriching... | Currently fetching data | Wait for completion |
| Ready | Row is ready for processing | Can proceed |
| Pending | Waiting to be processed | Will process soon |
| Processing | Being processed by system | Wait for completion |
| Completed | Successfully processed | Data is ready |
| Failed | Processing failed | Check data and retry |
| Not Found | No enrichment data available | Try different name/company |

## Troubleshooting

### Company Name Column Not Editable
**Solution:** Click directly on the cell and start typing. The cell should become editable.

### Enrichment Not Triggering
**Check:**
1. Both Full Name AND Company Name are filled
2. Row hasn't been enriched before
3. Check browser console for errors (F12)
4. Verify internet connection

### No Data Found
**Possible Reasons:**
- Name/company combination doesn't exist in Lusha database
- Typo in name or company
- Very new prospect not yet indexed
- Try alternative company name or spelling

### Data Not Saving
**Solution:**
1. Check internet connection
2. Verify Supabase is accessible
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for errors

## API Integration

The enrichment uses the Lusha API through Supabase Edge Functions:

**Endpoint:** `lusha-enrich` (Supabase Function)

**Request Parameters:**
```json
{
  "firstName": "Nishtha",
  "lastName": "Gupta",
  "companyName": "Axis Bank",
  "category": "PHONE_ONLY" or "EMAIL_ONLY"
}
```

**Response:**
```json
{
  "success": true,
  "phone": "+91-XXXXXXXXXX",
  "email": "nishtha@axisbank.com",
  "city": "Mumbai",
  "title": "Senior Manager",
  "company": "Axis Bank"
}
```

## Performance Tips

1. **Batch Entry:** Enter multiple names/companies before waiting for enrichment
2. **Keyboard Navigation:** Use Tab/Enter for faster data entry
3. **Copy/Paste:** Use Ctrl+V to paste multiple rows at once
4. **Bulk Add:** Use "+1000" button to add many rows at once

## Limitations

- Maximum 100,000 rows per session
- Enrichment limited by Lusha API credits
- One enrichment per row (no re-enrichment)
- Requires valid name + company combination

## Best Practices

1. **Accurate Names:** Use full, correct names for better matches
2. **Company Names:** Use official company names (not abbreviations)
3. **Consistent Format:** Keep naming conventions consistent
4. **Review Results:** Verify enriched data before using
5. **Backup Data:** Export important data regularly

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console (F12) for error messages
3. Contact support with error details
4. Provide screenshot of the issue

## Recent Updates

### Version 2.0 - Smart Enrichment
- ✅ Automatic Name + Company enrichment
- ✅ Real-time status updates
- ✅ Multi-field population (Phone, Email, City, Title)
- ✅ Improved error handling
- ✅ Better visual feedback
- ✅ Company Name column now fully editable

### Previous Features
- LinkedIn URL enrichment
- Bulk row management
- Copy/paste operations
- Auto-save functionality
- Multi-cell selection
