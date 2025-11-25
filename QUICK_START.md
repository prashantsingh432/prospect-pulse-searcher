# Quick Start - 5 Minutes to Testing

## 🚀 Get Running in 5 Steps

### Step 1: Install (1 min)
```bash
npm install
```

### Step 2: Start Server (30 sec)
```bash
npm run dev
```

### Step 3: Open Browser (30 sec)
```
http://localhost:8080
```

### Step 4: Login (1 min)
- Enter your email and password
- Click "Run RTNE" button

### Step 5: Test (2 min)
See below for test scenarios

---

## 🧪 Test Scenarios

### Test 1: Full Name + Company Enrichment ⭐ NEW

**What to do:**
1. Find row 1
2. Click on "Full Name" column
3. Type: `John Smith`
4. Press Tab to move to Company Name
5. Type: `Google`
6. Watch the magic happen!

**Expected Result:**
- "Enriching..." status appears
- Phone number auto-fills
- Email auto-fills
- Success toast notification

**Time:** ~5 seconds

---

### Test 2: LinkedIn URL Enrichment

**What to do:**
1. Find row 2
2. Click on "LinkedIn Profile URL" column
3. Paste a LinkedIn profile URL
4. Press Enter

**Expected Result:**
- "Enriching..." status appears
- Phone number auto-fills
- Email auto-fills
- Success toast notification

**Time:** ~5 seconds

---

### Test 3: Column Editing

**What to do:**
1. Click on any cell
2. Type some data
3. Press Tab to move to next cell
4. Verify data saves (auto-saves after 1 sec)

**Expected Result:**
- All cells are editable
- Data persists
- No errors in console

**Time:** ~2 minutes

---

## 📊 Column Order (NEW)

**Before:**
```
# | Phone | Phone2 | Phone3 | Phone4 | Email | Status | Full Name | City | Job Title | Company
```

**After:**
```
# | Full Name | Company | LinkedIn URL | Phone | Phone2 | Phone3 | Phone4 | Email | City | Job Title
```

✅ **Company Name is now editable!**

---

## 🎯 What Changed

### 1. Column Order
- Full Name moved to position 1
- Company Name moved to position 2
- LinkedIn URL moved to position 3

### 2. Company Name Editability
- ✅ Now fully editable
- ✅ Triggers enrichment when filled with Full Name
- ✅ Auto-saves to database

### 3. Smart Enrichment
- ✅ Triggers on LinkedIn URL paste
- ✅ Triggers on Full Name + Company fill
- ✅ Real-time status updates
- ✅ Auto-fills phone and email

---

## 🐛 Troubleshooting

### "Company Name still not editable?"
```
1. Press Ctrl + Shift + R (hard refresh)
2. Close browser completely
3. Reopen and try again
```

### "Enrichment not working?"
```
1. Check browser console (F12)
2. Verify Full Name AND Company are filled
3. Check internet connection
4. Restart dev server (Ctrl+C, then npm run dev)
```

### "Port 8080 already in use?"
```bash
# Kill the process
netstat -ano | findstr :8080
taskkill /PID [PID] /F

# Restart
npm run dev
```

---

## 📱 Browser Tips

### Hard Refresh (Clear Cache)
- **Windows:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

### Open Developer Tools
- **Windows:** `F12`
- **Mac:** `Cmd + Option + I`

### View Console Logs
1. Press `F12`
2. Click "Console" tab
3. Look for enrichment messages

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Full Name column is editable
2. ✅ Company Name column is editable
3. ✅ Columns are in order: Full Name → Company → LinkedIn
4. ✅ Filling Full Name + Company triggers enrichment
5. ✅ Phone and email auto-fill
6. ✅ Toast notifications appear
7. ✅ Data saves to database

---

## 📞 Quick Reference

| Action | Result |
|--------|--------|
| Fill Full Name + Company | Auto-enriches |
| Paste LinkedIn URL | Auto-enriches |
| Click any cell | Editable |
| Press Tab | Move right |
| Press Enter | Move down |
| Press Ctrl+Shift+R | Hard refresh |
| Press F12 | Open DevTools |

---

## 🎓 Key Features

### Smart Search
- Condition A: LinkedIn URL enrichment
- Condition B: Name + Company enrichment

### Auto-Enrichment
- Phone lookup
- Email lookup
- Real-time status

### Data Management
- Auto-save after 1 second
- Duplicate prevention
- Error handling

---

## 🚀 Next Steps

1. ✅ Run `npm install`
2. ✅ Run `npm run dev`
3. ✅ Open http://localhost:8080
4. ✅ Login and go to RTNE
5. ✅ Test Full Name + Company enrichment
6. ✅ Test LinkedIn URL enrichment
7. ✅ Verify column order and editability

---

## 📚 Full Documentation

For detailed information, see:
- `IMPLEMENTATION_SUMMARY.md` - Complete overview
- `COLUMN_ORDER_FIX.md` - Column changes
- `LOCAL_SETUP_GUIDE.md` - Detailed setup
- `LUSHA_SMART_SEARCH_UPGRADE.md` - Feature details

---

**Ready to test? Let's go! 🚀**

```bash
npm install && npm run dev
```

Then open: http://localhost:8080
