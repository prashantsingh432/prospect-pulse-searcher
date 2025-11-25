# Complete Testing Checklist

## Pre-Testing Setup

- [ ] Dependencies installed: `npm install`
- [ ] Dev server running: `npm run dev`
- [ ] Browser open: `http://localhost:8080`
- [ ] Logged in successfully
- [ ] Navigated to RTNE page
- [ ] Browser console open (F12)
- [ ] No errors in console

---

## Column Order & Editability Tests

### Column Order Verification
- [ ] Column 1: Full Name
- [ ] Column 2: Company Name
- [ ] Column 3: LinkedIn Profile URL
- [ ] Column 4: Primary Phone
- [ ] Column 5: Phone 2
- [ ] Column 6: Phone 3
- [ ] Column 7: Phone 4
- [ ] Column 8: Email Address
- [ ] Column 9: City
- [ ] Column 10: Job Title

### Column Editability
- [ ] Full Name column is editable
- [ ] Company Name column is editable ✅ FIXED
- [ ] LinkedIn URL column is editable
- [ ] City column is editable
- [ ] Job Title column is editable
- [ ] Phone columns are NOT editable (auto-filled)
- [ ] Email column is NOT editable (auto-filled)

---

## Full Name + Company Enrichment Tests

### Test 1: Basic Enrichment
- [ ] Enter "John Smith" in Full Name
- [ ] Enter "Google" in Company Name
- [ ] "Enriching..." status appears
- [ ] Phone number auto-fills
- [ ] Email auto-fills
- [ ] Success toast appears
- [ ] Data saves to database

### Test 2: Single Word Name
- [ ] Enter "Cher" in Full Name
- [ ] Enter "Sony Music" in Company Name
- [ ] "Enriching..." status appears
- [ ] Phone number auto-fills (if available)
- [ ] Email auto-fills (if available)
- [ ] No errors in console

### Test 3: Multi-Word Last Name
- [ ] Enter "John Smith Jr" in Full Name
- [ ] Enter "Apple" in Company Name
- [ ] "Enriching..." status appears
- [ ] Enrichment completes successfully
- [ ] No errors in console

### Test 4: No Data Found
- [ ] Enter "XYZ ABC" in Full Name
- [ ] Enter "NonExistentCorp123" in Company Name
- [ ] "Enriching..." status appears
- [ ] "No enrichment data found" message appears
- [ ] No errors in console

### Test 5: Partial Data
- [ ] Enter "Jane Doe" in Full Name
- [ ] Enter "Microsoft" in Company Name
- [ ] "Enriching..." status appears
- [ ] Phone fills but email doesn't (or vice versa)
- [ ] Partial success toast appears
- [ ] No errors in console

---

## LinkedIn URL Enrichment Tests

### Test 1: Valid LinkedIn URL
- [ ] Paste valid LinkedIn profile URL
- [ ] "Enriching..." status appears
- [ ] Phone number auto-fills
- [ ] Email auto-fills
- [ ] Success toast appears
- [ ] Data saves to database

### Test 2: Invalid LinkedIn URL
- [ ] Paste invalid URL (e.g., "https://google.com")
- [ ] No enrichment triggered
- [ ] No error message
- [ ] No API calls made

### Test 3: LinkedIn URL with Full Name
- [ ] Enter "John Smith" in Full Name
- [ ] Paste LinkedIn URL
- [ ] LinkedIn enrichment triggers (not Name+Company)
- [ ] Phone and email auto-fill
- [ ] Success toast appears

### Test 4: LinkedIn URL with Company
- [ ] Enter "Google" in Company Name
- [ ] Paste LinkedIn URL
- [ ] LinkedIn enrichment triggers (not Name+Company)
- [ ] Phone and email auto-fill
- [ ] Success toast appears

---

## Duplicate Prevention Tests

### Test 1: No Re-enrichment
- [ ] Fill Full Name + Company
- [ ] Enrichment completes
- [ ] Modify Full Name
- [ ] No re-enrichment triggered
- [ ] Data remains unchanged

### Test 2: Manual Re-trigger
- [ ] Fill Full Name + Company
- [ ] Enrichment completes
- [ ] Clear the row (right-click → Clear)
- [ ] Fill Full Name + Company again
- [ ] Enrichment triggers again
- [ ] New data fetched

### Test 3: Multiple Rows
- [ ] Fill Row 1: Full Name + Company
- [ ] Fill Row 2: Full Name + Company
- [ ] Both enrich independently
- [ ] No cross-row interference
- [ ] Each row has correct data

---

## Data Persistence Tests

### Test 1: Auto-Save
- [ ] Enter data in Full Name
- [ ] Wait 1 second
- [ ] Refresh page
- [ ] Data is still there
- [ ] No manual save needed

### Test 2: Enriched Data Persistence
- [ ] Fill Full Name + Company
- [ ] Wait for enrichment
- [ ] Refresh page
- [ ] Phone and email still there
- [ ] Data persisted to Supabase

### Test 3: Multiple Field Save
- [ ] Enter Full Name
- [ ] Enter Company Name
- [ ] Enter City
- [ ] Enter Job Title
- [ ] Wait 1 second
- [ ] Refresh page
- [ ] All data persists

---

## Navigation & Keyboard Tests

### Arrow Key Navigation
- [ ] Press Up arrow → Move to row above
- [ ] Press Down arrow → Move to row below
- [ ] Press Left arrow → Move to column left
- [ ] Press Right arrow → Move to column right

### Tab Navigation
- [ ] Press Tab → Move to next column
- [ ] Press Shift+Tab → Move to previous column
- [ ] Tab wraps to next row
- [ ] Shift+Tab wraps to previous row

### Enter Key Navigation
- [ ] Press Enter → Move down one row
- [ ] Press Shift+Enter → Move up one row
- [ ] Enter in last row → Create new row (if applicable)

### Edit Mode
- [ ] Press F2 → Enter edit mode
- [ ] Type text → Text appears
- [ ] Press Escape → Exit edit mode
- [ ] Press Enter → Save and move down
- [ ] Press Tab → Save and move right

---

## Error Handling Tests

### Test 1: API Error
- [ ] Disable internet connection
- [ ] Try to enrich
- [ ] Error toast appears
- [ ] Console shows error details
- [ ] App doesn't crash

### Test 2: Invalid Input
- [ ] Enter special characters in Full Name
- [ ] Enter numbers in Company Name
- [ ] Enrichment still attempts
- [ ] Handles gracefully

### Test 3: Timeout
- [ ] Enrich with slow connection
- [ ] "Enriching..." status shows
- [ ] Eventually completes or times out
- [ ] No hanging requests

### Test 4: Concurrent Requests
- [ ] Fill multiple rows quickly
- [ ] Each enriches independently
- [ ] No race conditions
- [ ] All complete successfully

---

## UI/UX Tests

### Status Indicators
- [ ] "Enriching..." spinner appears
- [ ] Spinner is animated
- [ ] Spinner disappears when done
- [ ] Status is clear and visible

### Toast Notifications
- [ ] Success toast appears
- [ ] Error toast appears
- [ ] Toast auto-dismisses
- [ ] Toast text is readable
- [ ] Multiple toasts stack

### Visual Feedback
- [ ] Selected cell has blue outline
- [ ] Hover shows outline
- [ ] Cut rows show visual indication
- [ ] Enriching rows show spinner

### Responsive Design
- [ ] Table scrolls horizontally
- [ ] Columns are properly sized
- [ ] Headers stay visible
- [ ] Row numbers stay visible
- [ ] No content overflow

---

## Browser Compatibility Tests

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

### Safari
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

### Edge
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

---

## Performance Tests

### Load Time
- [ ] Page loads in < 3 seconds
- [ ] No lag when scrolling
- [ ] No lag when typing

### Enrichment Speed
- [ ] Enrichment completes in < 10 seconds
- [ ] UI remains responsive
- [ ] No freezing

### Memory Usage
- [ ] No memory leaks
- [ ] Smooth scrolling
- [ ] No performance degradation

---

## Integration Tests

### Supabase Integration
- [ ] Data saves to Supabase
- [ ] Data loads from Supabase
- [ ] Updates work correctly
- [ ] No duplicate records

### Lusha API Integration
- [ ] API calls are made
- [ ] Responses are parsed correctly
- [ ] Phone data is extracted
- [ ] Email data is extracted

### Authentication
- [ ] User must be logged in
- [ ] Session persists
- [ ] Logout works
- [ ] Re-login works

---

## Edge Cases

### Test 1: Empty Fields
- [ ] Full Name empty, Company filled → No enrichment
- [ ] Full Name filled, Company empty → No enrichment
- [ ] Both empty → No enrichment

### Test 2: Whitespace
- [ ] Full Name with leading spaces → Trimmed
- [ ] Company with trailing spaces → Trimmed
- [ ] Enrichment works correctly

### Test 3: Special Characters
- [ ] Full Name with apostrophe (O'Brien) → Works
- [ ] Company with ampersand (A&B) → Works
- [ ] Enrichment handles correctly

### Test 4: Very Long Names
- [ ] Full Name with 100+ characters → Works
- [ ] Company with 100+ characters → Works
- [ ] No truncation issues

### Test 5: Unicode Characters
- [ ] Full Name with accents (José) → Works
- [ ] Company with non-ASCII → Works
- [ ] Enrichment handles correctly

---

## Regression Tests

### Test 1: Existing Features Still Work
- [ ] Row insertion works
- [ ] Row deletion works
- [ ] Row copy/paste works
- [ ] Row clear works
- [ ] Context menu works

### Test 2: Data Integrity
- [ ] No data loss
- [ ] No data corruption
- [ ] No duplicate entries
- [ ] No missing fields

### Test 3: Previous Functionality
- [ ] LinkedIn URL enrichment still works
- [ ] Phone columns still work
- [ ] Email columns still work
- [ ] Status column still works

---

## Final Verification

### Code Quality
- [ ] No console errors
- [ ] No console warnings
- [ ] No TypeScript errors
- [ ] Code is clean and readable

### Documentation
- [ ] README is updated
- [ ] Comments are clear
- [ ] Code is well-documented
- [ ] Changes are documented

### Deployment Readiness
- [ ] All tests pass
- [ ] No known bugs
- [ ] Performance is acceptable
- [ ] Ready for production

---

## Sign-Off

- [ ] All tests completed
- [ ] All tests passed
- [ ] No critical issues
- [ ] Ready for deployment

**Tested By:** _______________
**Date:** _______________
**Status:** ✅ APPROVED / ❌ NEEDS FIXES

---

## Notes

```
[Space for additional notes and observations]
```

---

**Last Updated:** November 25, 2025
**Version:** 1.0.0
