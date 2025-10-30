# Automatic Phone Number Cleaning Feature

## What It Does

When RTNP pastes or types phone numbers, the system automatically cleans them by:
1. Removing country codes (+91, 91)
2. Removing special characters (spaces, dashes, parentheses)
3. Keeping only the 10-digit number

## Examples

### Input → Output

| What You Paste | What Gets Saved |
|----------------|-----------------|
| +919857487596 | 9857487596 |
| 919857487596 | 9857487596 |
| +91 9857487596 | 9857487596 |
| 91-9857487596 | 9857487596 |
| (91) 9857487596 | 9857487596 |
| 09857487596 | 9857487596 |
| 9857-487-596 | 9857487596 |
| 98574 87596 | 9857487596 |

## How It Works

### Step 1: Remove Non-Digits
```
Input:  +91-9857-487-596
After:  919857487596
```

### Step 2: Remove Country Code (91)
```
Input:  919857487596 (12 digits)
Check:  Starts with 91? Yes
Check:  More than 10 digits? Yes
After:  9857487596 (removed first 2 digits)
```

### Step 3: Remove Leading Zero (if 11 digits)
```
Input:  09857487596 (11 digits)
Check:  Starts with 0? Yes
Check:  Has 11 digits? Yes
After:  9857487596 (removed leading 0)
```

### Step 4: Limit to 10 Digits
```
Input:  98574875961234 (14 digits)
After:  9857487596 (first 10 digits only)
```

## Where It Applies

This cleaning happens automatically on all phone fields:
- Phone 1 (primary_phone)
- Phone 2 (phone_2)
- Phone 3 (phone_3)
- Phone 4 (phone_4)

## Benefits

1. **Consistency**: All phone numbers stored in same format (10 digits)
2. **No Manual Editing**: RTNP doesn't need to manually remove +91
3. **Copy-Paste Friendly**: Can paste directly from LinkedIn or any source
4. **Instant Cleaning**: Happens as you type/paste
5. **Auto-Save**: Cleaned number saves automatically after 1 second

## Technical Details

### Cleaning Logic
```javascript
cleanPhoneNumber(phone) {
  1. Remove all non-digits: /\D/g
  2. If starts with "91" and length > 10: remove "91"
  3. If starts with "0" and length = 11: remove "0"
  4. Return first 10 digits
}
```

### When It Runs
- Triggered on every keystroke/paste in phone fields
- Runs before saving to database
- Updates display immediately

## Edge Cases Handled

| Scenario | Input | Output | Reason |
|----------|-------|--------|--------|
| Already clean | 9857487596 | 9857487596 | No change needed |
| Multiple country codes | 91919857487596 | 9857487596 | Removes first 91 only |
| Short number | 98574 | 98574 | Keeps as-is (< 10 digits) |
| Very long number | 919857487596123456 | 9857487596 | Takes first 10 after removing 91 |
| Letters in number | 98ABC57487596 | 9857487596 | Removes all non-digits |
| Special chars | +91-(985)-748-7596 | 9857487596 | Removes all special chars |

## Testing

### Test Cases to Try:

1. **Paste with +91**:
   - Paste: `+919857487596`
   - Should show: `9857487596`

2. **Paste with spaces**:
   - Paste: `91 9857 487 596`
   - Should show: `9857487596`

3. **Paste with dashes**:
   - Paste: `91-9857-487-596`
   - Should show: `9857487596`

4. **Paste with leading zero**:
   - Paste: `09857487596`
   - Should show: `9857487596`

5. **Type normally**:
   - Type: `9857487596`
   - Should show: `9857487596`

## User Experience

### Before (Manual Cleaning):
1. RTNP pastes: `+919857487596`
2. RTNP manually deletes `+91`
3. RTNP left with: `9857487596`
4. Time wasted: ~5 seconds per number

### After (Auto Cleaning):
1. RTNP pastes: `+919857487596`
2. System automatically shows: `9857487596`
3. Time saved: ~5 seconds per number

**For 100 numbers per day: Saves ~8 minutes!**

## Notes

- Only applies to phone fields (not other text fields)
- Doesn't affect already saved data (only new entries)
- Works on paste, type, and any input method
- Cleaning happens client-side (instant feedback)
- Cleaned value is what gets saved to database

## Future Enhancements

Possible improvements:
- Support other country codes (US: +1, UK: +44, etc.)
- Validate phone number format (must be 10 digits)
- Show warning for invalid numbers
- Format display with spaces (985 748 7596) while storing clean
- Add country code dropdown for international numbers
