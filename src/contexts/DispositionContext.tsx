import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface RevealedPhone {
  prospectId: number;
  phoneNumber: string;
  revealedAt: Date;
  dispositionRequired: boolean;
}

interface DispositionContextType {
  revealedPhones: RevealedPhone[];
  hasPendingDisposition: boolean;
  addRevealedPhone: (prospectId: number, phoneNumber: string) => void;
  markDispositionComplete: (prospectId: number) => void;
  canPerformSearch: () => boolean;
  canSearchSpecificProspect: (prospectId: number) => boolean;
  getPendingDispositionMessage: () => string;
  clearAllPendingDispositions: () => void;
}

const DispositionContext = createContext<DispositionContextType | undefined>(undefined);

export const useDisposition = () => {
  const context = useContext(DispositionContext);
  if (context === undefined) {
    throw new Error('useDisposition must be used within a DispositionProvider');
  }
  return context;
};

export const DispositionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin } = useAuth();
  const [revealedPhones, setRevealedPhones] = useState<RevealedPhone[]>([]);

  // Load revealed phones from localStorage on mount
  useEffect(() => {
    if (user && !isAdmin()) {
      const storageKey = `revealed_phones_${user.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRevealedPhones(parsed.map((phone: any) => ({
            ...phone,
            revealedAt: new Date(phone.revealedAt)
          })));
        } catch (error) {
          console.error('Error loading revealed phones from storage:', error);
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [user, isAdmin]);

  // Save revealed phones to localStorage whenever it changes
  useEffect(() => {
    if (user && !isAdmin() && revealedPhones.length > 0) {
      const storageKey = `revealed_phones_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(revealedPhones));
    }
  }, [revealedPhones, user, isAdmin]);

  const addRevealedPhone = (prospectId: number, phoneNumber: string) => {
    console.log('addRevealedPhone called:', { prospectId, phoneNumber, isAdmin: isAdmin() });

    // Only track for non-admin users
    if (isAdmin()) {
      console.log('User is admin, not tracking phone');
      return;
    }

    // Check if this phone is already revealed and pending
    const existingPhone = revealedPhones.find(
      phone => phone.prospectId === prospectId && phone.phoneNumber === phoneNumber
    );

    console.log('Existing phone check:', { existingPhone, currentRevealedPhones: revealedPhones });

    if (!existingPhone) {
      const newRevealedPhone: RevealedPhone = {
        prospectId,
        phoneNumber,
        revealedAt: new Date(),
        dispositionRequired: true
      };

      console.log('Adding new revealed phone:', newRevealedPhone);
      setRevealedPhones(prev => [...prev, newRevealedPhone]);
    } else {
      console.log('Phone already exists, not adding');
    }
  };

  const markDispositionComplete = (prospectId: number) => {
    console.log('markDispositionComplete called:', { prospectId, currentRevealedPhones: revealedPhones });

    setRevealedPhones(prev => {
      const updated = prev.map(phone =>
        phone.prospectId === prospectId
          ? { ...phone, dispositionRequired: false }
          : phone
      );
      console.log('Updated revealed phones:', updated);
      return updated;
    });

    // Clean up localStorage for this user
    if (user && !isAdmin()) {
      const storageKey = `revealed_phones_${user.id}`;
      const updatedPhones = revealedPhones.map(phone =>
        phone.prospectId === prospectId
          ? { ...phone, dispositionRequired: false }
          : phone
      );

      // Remove completed dispositions from storage
      const pendingPhones = updatedPhones.filter(phone => phone.dispositionRequired);
      console.log('Pending phones after completion:', pendingPhones);

      if (pendingPhones.length === 0) {
        console.log('No pending phones, removing from localStorage');
        localStorage.removeItem(storageKey);
      } else {
        console.log('Saving pending phones to localStorage:', pendingPhones);
        localStorage.setItem(storageKey, JSON.stringify(pendingPhones));
      }
    }
  };

  const clearAllPendingDispositions = () => {
    setRevealedPhones([]);
    if (user && !isAdmin()) {
      const storageKey = `revealed_phones_${user.id}`;
      localStorage.removeItem(storageKey);
    }
  };

  const hasPendingDisposition = revealedPhones.some(phone => phone.dispositionRequired);

  const canPerformSearch = () => {
    // Admin users can always search
    if (isAdmin()) {
      return true;
    }
    
    // Non-admin users can only search if they have no pending dispositions
    return !hasPendingDisposition;
  };

  const canSearchSpecificProspect = (prospectId: number) => {
    // Admin users can always search
    if (isAdmin()) {
      return true;
    }
    
    // Non-admin users can search if no pending dispositions OR if searching for the prospect with pending disposition
    if (!hasPendingDisposition) {
      return true;
    }
    
    // Check if this specific prospect has a pending disposition (they can search for it)
    const hasPendingForThisProspect = revealedPhones.some(
      phone => phone.prospectId === prospectId && phone.dispositionRequired
    );
    
    return hasPendingForThisProspect;
  };

  const getPendingDispositionMessage = () => {
    const pendingCount = revealedPhones.filter(phone => phone.dispositionRequired).length;
    if (pendingCount === 0) {
      return '';
    }
    
    if (pendingCount === 1) {
      return 'Please fill disposition first - You have 1 revealed phone number that requires disposition.';
    }
    
    return `Please fill disposition first - You have ${pendingCount} revealed phone numbers that require disposition.`;
  };

  const value = {
    revealedPhones,
    hasPendingDisposition,
    addRevealedPhone,
    markDispositionComplete,
    canPerformSearch,
    canSearchSpecificProspect,
    getPendingDispositionMessage,
    clearAllPendingDispositions
  };

  return (
    <DispositionContext.Provider value={value}>
      {children}
    </DispositionContext.Provider>
  );
};
