import React, { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PhoneDispositionCellProps {
  rowId: number;
  supabaseId?: string;
  phoneNumber: string;
  phoneIndex: 1 | 2 | 3 | 4; // 1 = primary_phone, 2 = phone2, etc.
  disposition?: 'correct' | 'wrong' | null;
  userId?: string;
  isEditing: boolean;
  isSelected: boolean;
  onCellClick: (e: React.MouseEvent) => void;
  onCellDoubleClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseUp: () => void;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: (e: React.FocusEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDispositionChange: (phoneIndex: 1 | 2 | 3 | 4, disposition: 'correct' | 'wrong') => void;
  cellDataAttribute: string;
}

const PhoneDispositionCell: React.FC<PhoneDispositionCellProps> = ({
  rowId,
  supabaseId,
  phoneNumber,
  phoneIndex,
  disposition,
  userId,
  isEditing,
  isSelected,
  onCellClick,
  onCellDoubleClick,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  onDispositionChange,
  cellDataAttribute,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleDisposition = async (newDisposition: 'correct' | 'wrong', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!phoneNumber || !phoneNumber.trim()) {
      toast.error("No phone number to mark");
      return;
    }

    if (!supabaseId) {
      toast.error("Row not saved yet. Please wait for auto-save.");
      return;
    }

    setIsSaving(true);

    try {
      const dispositionColumn = `phone${phoneIndex}_disposition`;
      const dispositionAtColumn = `phone${phoneIndex}_disposition_at`;
      const dispositionByColumn = `phone${phoneIndex}_disposition_by`;

      const { error } = await supabase
        .from('rtne_requests')
        .update({
          [dispositionColumn]: newDisposition,
          [dispositionAtColumn]: new Date().toISOString(),
          [dispositionByColumn]: userId,
        } as any)
        .eq('id', supabaseId);

      if (error) throw error;

      onDispositionChange(phoneIndex, newDisposition);
      
      toast.success(
        newDisposition === 'correct' 
          ? "✓ Number marked as correct!" 
          : "✗ Number marked as wrong"
      );
    } catch (error) {
      console.error('Error saving disposition:', error);
      toast.error("Failed to save disposition");
    } finally {
      setIsSaving(false);
    }
  };

  const hasPhoneNumber = phoneNumber && phoneNumber.trim().length > 0;

  return (
    <td
      className={`px-3 py-2 border-b border-r border-gray-300 text-sm cursor-pointer ${
        isSelected
          ? 'outline outline-2 outline-blue-500 bg-blue-50'
          : 'hover:outline hover:outline-2 hover:outline-blue-500'
      }`}
      onClick={onCellClick}
      onDoubleClick={onCellDoubleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
    >
      <div className="flex items-center gap-1 w-full">
        {/* Disposition indicator if already set */}
        {disposition && (
          <div className={`flex-shrink-0 ${disposition === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
            {disposition === 'correct' ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </div>
        )}
        
        {/* Phone number input */}
        <input
          data-cell={cellDataAttribute}
          className={`flex-1 border-none focus:ring-0 focus:outline-none p-0 bg-transparent text-sm font-medium ${
            disposition === 'correct' ? 'text-green-700' : disposition === 'wrong' ? 'text-red-500 line-through' : ''
          }`}
          type="text"
          value={phoneNumber}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
        />
        
        {/* Disposition buttons - show only if phone number exists and no disposition yet */}
        {hasPhoneNumber && !disposition && (
          <div className="flex-shrink-0 flex items-center gap-0.5">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => handleDisposition('correct', e)}
                      className="p-1 hover:bg-green-100 rounded transition-colors text-green-600 hover:text-green-700"
                      aria-label="Mark as correct number"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Correct number - Call connected</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => handleDisposition('wrong', e)}
                      className="p-1 hover:bg-red-100 rounded transition-colors text-red-500 hover:text-red-600"
                      aria-label="Mark as wrong number"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Wrong number - Invalid/disconnected</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>
    </td>
  );
};

export default PhoneDispositionCell;
