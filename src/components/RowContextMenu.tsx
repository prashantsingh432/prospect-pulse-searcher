import React, { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Copy, Scissors, FileText, Eye, EyeOff, MoreHorizontal, Trash2, ChevronRight, ClipboardPaste } from 'lucide-react';

interface RowContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onDeleteRow: () => void;
  onClearRow: () => void;
  onCopyRow: () => void;
  onCutRow: () => void;
  onPasteRow: () => void;
  onHideRow?: () => void;
  onResizeRow?: () => void;
  rowNumber: number;
  hasClipboard?: boolean;
}

const RowContextMenu: React.FC<RowContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onInsertRowAbove,
  onInsertRowBelow,
  onDeleteRow,
  onClearRow,
  onCopyRow,
  onCutRow,
  onPasteRow,
  onHideRow,
  onResizeRow,
  rowNumber,
  hasClipboard = false
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPasteSpecial, setShowPasteSpecial] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x;
      let newY = position.y;

      // Adjust horizontal position if menu goes off-screen
      if (position.x + menuRect.width > viewportWidth) {
        newX = viewportWidth - menuRect.width - 10;
      }

      // Adjust vertical position if menu goes off-screen
      if (position.y + menuRect.height > viewportHeight) {
        newY = viewportHeight - menuRect.height - 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isOpen, position]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Invisible overlay to close menu when clicking outside */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed bg-white rounded-md shadow-xl border border-gray-300 py-1 z-50 min-w-[240px]"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Row number indicator */}
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="text-xs text-gray-600 font-medium">Row {rowNumber}</div>
        </div>
        
        {/* Standard editing options */}
        <button
          onClick={() => handleClick(onCutRow)}
          className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center">
            <Scissors className="h-4 w-4 mr-3 text-gray-500" />
            <span>Cut</span>
          </div>
          <span className="text-xs text-gray-400 ml-8">Ctrl+X</span>
        </button>
        
        <button
          onClick={() => handleClick(onCopyRow)}
          className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center">
            <Copy className="h-4 w-4 mr-3 text-gray-500" />
            <span>Copy</span>
          </div>
          <span className="text-xs text-gray-400 ml-8">Ctrl+C</span>
        </button>
        
        <button
          onClick={() => handleClick(onPasteRow)}
          disabled={!hasClipboard}
          className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-colors ${
            hasClipboard 
              ? 'text-gray-700 hover:bg-gray-100' 
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-3 text-gray-500" />
            <span>Paste</span>
          </div>
          <span className="text-xs text-gray-400 ml-8">Ctrl+V</span>
        </button>

        {/* Paste special submenu */}
        <div 
          className="relative"
          onMouseEnter={() => setShowPasteSpecial(true)}
          onMouseLeave={() => setShowPasteSpecial(false)}
        >
          <button
            disabled={!hasClipboard}
            className={`flex items-center justify-between w-full px-4 py-2 text-sm transition-colors ${
              hasClipboard 
                ? 'text-gray-700 hover:bg-gray-100' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center">
              <ClipboardPaste className="h-4 w-4 mr-3 text-gray-500" />
              <span>Paste special</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>

          {/* Submenu */}
          {showPasteSpecial && hasClipboard && (
            <div className="absolute left-full top-0 ml-1 bg-white rounded-md shadow-xl border border-gray-300 py-1 min-w-[180px]">
              <button
                onClick={() => handleClick(onPasteRow)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Paste values only
              </button>
              <button
                onClick={() => handleClick(onPasteRow)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Paste format only
              </button>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* Row manipulation options */}
        <button
          onClick={() => handleClick(onInsertRowAbove)}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-4 w-4 mr-3 text-gray-500" />
          <span>Insert 1 row above</span>
        </button>
        
        <button
          onClick={() => handleClick(onInsertRowBelow)}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-4 w-4 mr-3 text-gray-500" />
          <span>Insert 1 row below</span>
        </button>
        
        <button
          onClick={() => handleClick(onDeleteRow)}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4 mr-3" />
          <span>Delete row</span>
        </button>
        
        <button
          onClick={() => handleClick(onClearRow)}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Minus className="h-4 w-4 mr-3 text-gray-500" />
          <span>Clear row</span>
        </button>

        <div className="h-px bg-gray-200 my-1" />

        {/* Additional options */}
        {onHideRow && (
          <button
            onClick={() => handleClick(onHideRow)}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <EyeOff className="h-4 w-4 mr-3 text-gray-500" />
            <span>Hide row</span>
          </button>
        )}
        
        {onResizeRow && (
          <button
            onClick={() => handleClick(onResizeRow)}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 mr-3 text-gray-500" />
            <span>Resize row</span>
          </button>
        )}
      </div>
    </>
  );
};

export default RowContextMenu;