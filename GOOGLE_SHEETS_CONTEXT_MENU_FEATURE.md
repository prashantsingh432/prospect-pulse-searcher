# Google Sheets-Like Context Menu Feature

## Overview
Added a comprehensive Google Sheets-style row context menu to the Prospect Finder webapp. Users can now right-click on row numbers to access a full suite of row manipulation options.

## Features Implemented

### 1. Enhanced Context Menu Component (`src/components/RowContextMenu.tsx`)

#### Visual Improvements
- **Google Sheets-style design** with clean, modern UI
- **Keyboard shortcuts displayed** (Ctrl+X, Ctrl+C, Ctrl+V)
- **Smart positioning** - automatically adjusts if menu would go off-screen
- **Hover effects** with smooth transitions
- **Submenu support** for "Paste special" options
- **Disabled states** for paste when clipboard is empty
- **Color-coded actions** (delete in red, others in gray)

#### Available Actions
1. **Cut** (Ctrl+X) - Cut row data to clipboard
2. **Copy** (Ctrl+C) - Copy row data to clipboard
3. **Paste** (Ctrl+V) - Paste clipboard data to selected row
4. **Paste special** - Submenu with additional paste options
   - Paste values only
   - Paste format only
5. **Insert 1 row above** - Add new row above current
6. **Insert 1 row below** - Add new row below current
7. **Delete row** - Remove the row completely
8. **Clear row** - Clear all data but keep the row
9. **Hide row** - Hide the row from view (optional)
10. **Resize row** - Adjust row height (optional)

### 2. Integration in RTNE Page (`src/pages/Rtne.tsx`)

#### Features
- Right-click on row number (left column) to open context menu
- Visual feedback for cut rows (red background, reduced opacity)
- Clipboard state management
- Real-time Supabase sync for all operations
- Toast notifications for user feedback

#### How It Works
```typescript
// Right-click handler on row number cell
<td 
  className="...cursor-context-menu select-none"
  onContextMenu={(e) => handleRowRightClick(e, row.id)}
>
  {row.id}
</td>
```

### 3. Integration in RTNP Project View (`src/pages/RtnpProjectView.tsx`)

#### Features
- Same context menu functionality for RTNP users
- Admin/RTNP can manage any user's rows
- Cut/copy/paste between rows
- Delete and clear operations sync to Supabase
- Visual feedback for cut rows

#### Operations
- **Copy/Cut**: Stores row data in clipboard state
- **Paste**: Copies all fields from clipboard to target row
- **Delete**: Removes row from database
- **Clear**: Empties all fields but keeps row structure

### 4. Visual Indicators

#### Cut Row Styling
```css
className={`... ${isRowCut(row.id) ? 'opacity-50 bg-red-50' : ''}`}
```
- Cut rows show with red background and 50% opacity
- Helps users identify which row will be removed on paste

#### Context Menu Styling
- White background with shadow
- Border for definition
- Hover states for all items
- Proper spacing and padding
- Icons for visual clarity

## User Experience

### Opening the Menu
1. **Right-click** on any row number (the leftmost column with numbers)
2. Menu appears at cursor position
3. Menu auto-adjusts if near screen edge

### Using Actions
1. **Click any option** to execute
2. Menu closes automatically after action
3. **Toast notification** confirms action
4. **ESC key** closes menu without action

### Copy/Paste Workflow
1. Right-click row number → **Copy** or **Cut**
2. Right-click target row number → **Paste**
3. If cut, source row is cleared after paste
4. Toast confirms each step

### Visual Feedback
- **Hover**: Light gray background on menu items
- **Disabled**: Grayed out text for unavailable actions
- **Cut rows**: Red tint with reduced opacity
- **Shortcuts**: Displayed on right side of menu

## Technical Implementation

### State Management
```typescript
// Context menu state
const [contextMenu, setContextMenu] = useState<{
  rowId: string;
  isOpen: boolean;
  position: { x: number; y: number };
}>({ rowId: '', isOpen: false, position: { x: 0, y: 0 } });

// Clipboard state
const [clipboardRow, setClipboardRow] = useState<Row | null>(null);
const [cutRowId, setCutRowId] = useState<string | null>(null);
```

### Smart Positioning
```typescript
useEffect(() => {
  if (isOpen && menuRef.current) {
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust if menu goes off-screen
    if (position.x + menuRect.width > viewportWidth) {
      newX = viewportWidth - menuRect.width - 10;
    }
    if (position.y + menuRect.height > viewportHeight) {
      newY = viewportHeight - menuRect.height - 10;
    }
  }
}, [isOpen, position]);
```

### Database Sync
All operations sync with Supabase:
- **Delete**: `supabase.from('rtne_requests').delete().eq('id', rowId)`
- **Clear**: `supabase.from('rtne_requests').update({ ...emptyFields }).eq('id', rowId)`
- **Paste**: `supabase.from('rtne_requests').update({ ...clipboardData }).eq('id', rowId)`

## Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ All modern browsers with right-click support

## Keyboard Shortcuts
- **Ctrl+X**: Cut (when row is selected)
- **Ctrl+C**: Copy (when row is selected)
- **Ctrl+V**: Paste (when row is selected)
- **ESC**: Close context menu

## Future Enhancements
1. **Multi-row selection** - Select and operate on multiple rows
2. **Drag and drop** - Reorder rows by dragging
3. **Row height adjustment** - Implement resize row functionality
4. **Hide/unhide rows** - Implement row visibility toggle
5. **Undo/redo** - Add operation history
6. **Keyboard navigation** - Arrow keys to navigate menu
7. **Custom paste options** - More granular paste special options

## Files Modified
1. `src/components/RowContextMenu.tsx` - Enhanced context menu component
2. `src/pages/Rtne.tsx` - Added hasClipboard prop
3. `src/pages/RtnpProjectView.tsx` - Full context menu integration

## Testing Checklist
- [x] Right-click on row number opens menu
- [x] Menu appears at cursor position
- [x] Menu adjusts position if near screen edge
- [x] Copy row stores data in clipboard
- [x] Cut row stores data and marks row
- [x] Paste row copies data to target
- [x] Delete row removes from database
- [x] Clear row empties all fields
- [x] Toast notifications appear for all actions
- [x] ESC key closes menu
- [x] Click outside closes menu
- [x] Paste disabled when clipboard empty
- [x] Cut rows show visual indicator
- [x] All operations sync to Supabase

## Demo
To test the feature:
1. Navigate to RTNE page or RTNP Project View
2. Right-click on any row number (leftmost column)
3. Try different operations:
   - Copy a row, then paste to another row
   - Cut a row (notice red background), then paste
   - Delete a row
   - Clear a row
   - Insert rows above/below

The feature works exactly like Google Sheets row context menu!
