# RTNE Smart Enrichment - Testing Checklist

## Pre-Test Setup
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Browser open at `http://localhost:8080`
- [ ] Logged in to the application
- [ ] Navigated to RTNE page

## Test Case 1: Basic Name + Company Enrichment

### Steps:
1. [ ] Click on Row 1, Full Name column
2. [ ] Type: "Nishtha Gupta"
3. [ ] Press Tab to move to Company Name column
4. [ ] Type: "Axis Bank"
5. [ ] Press Enter or Tab

### Expected Results:
- [ ] "Enriching..." appears in Status column
- [ ] Spinner animates in Status column
- [ ] After 2-5 seconds, phone number appears in Primary Phone column
- [ ] Email appears in Email Address column
- [ ] Toast notification shows "Phone enriched!" and "Email enriched!"
- [ ] Status column shows completion indicator

---

## Test Case 2: Single Word Name Handling

### Steps:
1. [ ] Click on Row 2, Full Name column
2. [ ] Type: "Cher"
3. [ ] Press Tab to Company Name column
4. [ ] Type: "Sony Music"
5. [ ] Press Enter

### Expected Results:
- [ ] System splits "Cher" as firstName: "Cher", lastName: ""
- [ ] Enrichment still triggers
- [ ] Data populates if found
- [ ] No errors in console

---

## Test Case 3: Company Name Column Editability

### Steps:
1. [ ] Click on Row 3, Company Name column
2. [ ] Type: "Microsoft"
3. [ ] Verify the text appears in the cell
4. [ ] Click on Full Name column in same row
5. [ ] Type: "Bill Gates"
6. [ ] Press Enter

### Expected Results:
- [ ] Company Name column accepts input
- [ ] Text is editable and visible
- [ ] Enrichment triggers when both fields filled
- [ ] No "read-only" errors

---

## Test Case 4: Partial Data (No Enrichment)

### Steps:
1. [ ] Click on Row 4, Full Name column
2. [ ] Type: "John Smith"
3. [ ] Leave Company Name empty
4. [ ] Press Enter

### Expected Results:
- [ ] No enrichment triggers
- [ ] Status column remains empty
- [ ] No toast notifications
- [ ] Row remains unchanged

---

## Test Case 5: Company Only (No Enrichment)

### Steps:
1. [ ] Click on Row 5, Company Name column
2. [ ] Type: "Google"
3. [ ] Leave Full Name empty
4. [ ] Press Enter

### Expected Results:
- [ ] No enrichment triggers
- [ ] Status column remains empty
- [ ] No toast notifications
- [ ] Row remains unchanged

---

## Test Case 6: No Data Found Scenario

### Steps:
1. [ ] Click on Row 6, Full Name column
2. [ ] Type: "XYZ123ABC"
3. [ ] Press Tab to Company Name column
4. [ ] Type: "NonExistentCorp999"
5. [ ] Press Enter

### Expected Results:
- [ ] "Enriching..." appears briefly
- [ ] Toast shows "No data found for this prospect"
- [ ] Phone and Email columns remain empty
- [ ] Status shows "Not Found" or similar

---

## Test Case 7: Multiple Rows Enrichment

### Steps:
1. [ ] Fill Row 7: Full Name "Alice Johnson", Company "Apple"
2. [ ] Fill Row 8: Full Name "Bob Wilson", Company "Amazon"
3. [ ] Fill Row 9: Full Name "Carol Davis", Company "Meta"
4. [ ] Wait for all to complete

### Expected Results:
- [ ] Each row enriches independently
- [ ] No interference between rows
- [ ] All data populates correctly
- [ ] Each row shows appropriate status

---

## Test Case 8: Data Persistence

### Steps:
1. [ ] Fill Row 10 with name and company
2. [ ] Wait for enrichment to complete
3. [ ] Hard refresh browser (Ctrl+Shift+R)
4. [ ] Navigate back to RTNE page

### Expected Results:
- [ ] Enriched data persists after refresh
- [ ] Phone and email still visible
- [ ] Data saved to Supabase
- [ ] No data loss

---

## Test Case 9: Keyboard Navigation

### Steps:
1. [ ] Click on Row 11, Full Name column
2. [ ] Type: "David Lee"
3. [ ] Press Tab (move to Company Name)
4. [ ] Type: "Tesla"
5. [ ] Press Enter (move down)
6. [ ] Verify enrichment triggered

### Expected Results:
- [ ] Tab moves between cells correctly
- [ ] Enter moves to next row
- [ ] Enrichment triggers after both fields filled
- [ ] Navigation doesn't interfere with enrichment

---

## Test Case 10: Copy/Paste Operations

### Steps:
1. [ ] Fill Row 12: "Emma Wilson", "Netflix"
2. [ ] Wait for enrichment
3. [ ] Select the enriched phone number (Ctrl+C)
4. [ ] Click on Row 13, Primary Phone column
5. [ ] Paste (Ctrl+V)

### Expected Results:
- [ ] Copy/paste works correctly
- [ ] Phone number pastes into new row
- [ ] No enrichment triggered by paste
- [ ] Data integrity maintained

---

## Test Case 11: Status Column Display

### Steps:
1. [ ] Observe Row 1 during enrichment
2. [ ] Watch Status column for spinner
3. [ ] Wait for completion
4. [ ] Check final status display

### Expected Results:
- [ ] Spinner visible during enrichment
- [ ] "Enriching..." text shows
- [ ] Status updates after completion
- [ ] Visual feedback is clear

---

## Test Case 12: Error Handling

### Steps:
1. [ ] Open browser console (F12)
2. [ ] Fill Row 14 with valid data
3. [ ] Monitor console for errors
4. [ ] Check for any error messages

### Expected Results:
- [ ] No JavaScript errors in console
- [ ] No network errors
- [ ] Graceful error handling if API fails
- [ ] User-friendly error messages

---

## Test Case 13: Bulk Row Addition

### Steps:
1. [ ] Click "+100" button at bottom
2. [ ] Verify 100 new rows added
3. [ ] Fill one of the new rows with name/company
4. [ ] Verify enrichment works

### Expected Results:
- [ ] New rows added successfully
- [ ] Row numbers increment correctly
- [ ] Enrichment works on new rows
- [ ] No performance issues

---

## Test Case 14: Field Updates (City, Job Title)

### Steps:
1. [ ] Fill Row 15: "Sarah Chen", "Google"
2. [ ] Wait for enrichment
3. [ ] Check if City column populated
4. [ ] Check if Job Title column populated

### Expected Results:
- [ ] City field updates if available
- [ ] Job Title field updates if available
- [ ] All relevant fields populated
- [ ] No data loss

---

## Test Case 15: Enrichment Prevents Re-enrichment

### Steps:
1. [ ] Fill Row 16 with name/company
2. [ ] Wait for enrichment
3. [ ] Edit the Full Name field again
4. [ ] Verify no re-enrichment occurs

### Expected Results:
- [ ] Row marked as enriched
- [ ] No duplicate enrichment calls
- [ ] System prevents re-enrichment
- [ ] Data remains stable

---

## Browser Compatibility Testing

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Mobile browser (if applicable)

---

## Performance Testing

- [ ] Add 1000 rows
- [ ] Verify no lag
- [ ] Scroll smoothly
- [ ] Enrichment still responsive

---

## Final Verification

- [ ] All test cases passed
- [ ] No console errors
- [ ] Data persists correctly
- [ ] UI is responsive
- [ ] Enrichment works reliably
- [ ] Company Name column is editable
- [ ] Status feedback is clear

---

## Notes

- Record any issues found
- Note any unexpected behavior
- Test with real Lusha API credentials
- Verify Supabase connection
- Check API rate limits

---

## Sign-Off

- [ ] All tests completed
- [ ] No critical issues found
- [ ] Ready for production
- [ ] Documentation complete

**Tested By:** _______________
**Date:** _______________
**Status:** ✅ PASSED / ❌ FAILED
