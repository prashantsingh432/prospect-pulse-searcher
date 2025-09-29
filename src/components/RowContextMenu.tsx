import React from 'react';
import { Plus, Minus, Copy, Scissors, FileText, Eye, EyeOff, MoreHorizontal, Trash2 } from 'lucide-react';

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
  rowNumber: number;
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
  rowNumber
}) => {
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
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Standard editing options */}
        <div className="px-3 py-1">
          <div className="text-xs text-gray-500 font-medium mb-1">Row {rowNumber}</div>
        </div>
        
        <button
          onClick={() => handleClick(onCutRow)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Scissors className="h-4 w-4 mr-3" />
          Cut
          <span className="ml-auto text-xs text-gray-400">Ctrl+X</span>
        </button>
        
        <button
          onClick={() => handleClick(onCopyRow)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Copy className="h-4 w-4 mr-3" />
          Copy
          <span className="ml-auto text-xs text-gray-400">Ctrl+C</span>
        </button>
        
        <button
          onClick={() => handleClick(onPasteRow)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <FileText className="h-4 w-4 mr-3" />
          Paste
          <span className="ml-auto text-xs text-gray-400">Ctrl+V</span>
        </button>

        <div className="h-px bg-gray-200 my-1" />

        {/* Row manipulation options */}
        <button
          onClick={() => handleClick(onInsertRowAbove)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4 mr-3" />
          Insert 1 row above
        </button>
        
        <button
          onClick={() => handleClick(onInsertRowBelow)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4 mr-3" />
          Insert 1 row below
        </button>
        
        <button
          onClick={() => handleClick(onDeleteRow)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Trash2 className="h-4 w-4 mr-3" />
          Delete row
        </button>
        
        <button
          onClick={() => handleClick(onClearRow)}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Minus className="h-4 w-4 mr-3" />
          Clear row
        </button>

        <div className="h-px bg-gray-200 my-1" />

        {/* Additional options */}
        <button
          onClick={onClose}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <Eye className="h-4 w-4 mr-3" />
          Hide row
        </button>
        
        <button
          onClick={onClose}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <MoreHorizontal className="h-4 w-4 mr-3" />
          Resize row
        </button>
      </div>
    </>
  );
};

export default RowContextMenu;