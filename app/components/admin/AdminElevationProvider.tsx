'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AdminElevationModal from './AdminElevationModal';

interface ElevationState {
  isAdmin: boolean;
  totpEnabled: boolean;
  isElevated: boolean;
  elevatedUntil: string | null;
  requiresElevation: boolean;
  loading: boolean;
}

interface AdminElevationContextType {
  state: ElevationState;
  checkElevation: () => Promise<void>;
  requireElevation: () => void;
  deElevate: () => Promise<void>;
}

const AdminElevationContext = createContext<AdminElevationContextType | null>(null);

const ELEVATION_STORAGE_KEY = 'admin_elevation_checked';

export function AdminElevationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ElevationState>({
    isAdmin: false,
    totpEnabled: false,
    isElevated: false,
    elevatedUntil: null,
    requiresElevation: false,
    loading: true,
  });

  const [showModal, setShowModal] = useState(false);
  const [requiresSetup, setRequiresSetup] = useState(false);

  const checkElevation = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/2fa/elevate');
      if (!res.ok) {
        setState(prev => ({ ...prev, isAdmin: false, loading: false }));
        return;
      }

      const data = await res.json();
      setState({
        isAdmin: data.isAdmin,
        totpEnabled: data.totpEnabled,
        isElevated: data.isElevated,
        elevatedUntil: data.elevatedUntil,
        requiresElevation: data.requiresElevation,
        loading: false,
      });

      // If admin has 2FA enabled and isn't elevated, show modal
      if (data.isAdmin && data.totpEnabled && !data.isElevated) {
        setShowModal(true);
      }

      // If admin doesn't have 2FA enabled yet, prompt setup on first visit
      if (data.isAdmin && !data.totpEnabled) {
        const hasSeenSetupPrompt = sessionStorage.getItem('admin_2fa_setup_dismissed');
        if (!hasSeenSetupPrompt) {
          setRequiresSetup(true);
          setShowModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking elevation:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkElevation();

    // Check elevation periodically (every 5 minutes)
    const interval = setInterval(checkElevation, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkElevation]);

  const requireElevation = () => {
    if (!state.isElevated && state.isAdmin) {
      setShowModal(true);
    }
  };

  const deElevate = async () => {
    try {
      await fetch('/api/admin/2fa/elevate', { method: 'DELETE' });
      setState(prev => ({
        ...prev,
        isElevated: false,
        elevatedUntil: null,
        requiresElevation: prev.totpEnabled,
      }));
    } catch (error) {
      console.error('Error de-elevating:', error);
    }
  };

  const handleElevated = () => {
    setShowModal(false);
    setRequiresSetup(false);
    checkElevation();
  };

  const handleClose = () => {
    // Only allow closing if it's just the setup prompt (not required elevation)
    if (requiresSetup && !state.totpEnabled) {
      setShowModal(false);
      sessionStorage.setItem('admin_2fa_setup_dismissed', 'true');
    }
    // If 2FA is enabled but not elevated, don't allow closing
  };

  // Determine if we should block access
  const shouldBlockAccess = state.isAdmin && state.totpEnabled && !state.isElevated && !state.loading;

  return (
    <AdminElevationContext.Provider value={{ state, checkElevation, requireElevation, deElevate }}>
      {/* Only render admin content if elevated OR if 2FA isn't enabled yet */}
      {state.loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#94a3b8',
        }}>
          Loading...
        </div>
      ) : shouldBlockAccess ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#94a3b8',
        }}>
          {/* Empty - modal will show on top */}
        </div>
      ) : (
        children
      )}
      <AdminElevationModal
        isOpen={showModal || shouldBlockAccess}
        onClose={handleClose}
        onElevated={handleElevated}
        requiresSetup={requiresSetup}
        canDismiss={requiresSetup && !state.totpEnabled}
      />
    </AdminElevationContext.Provider>
  );
}

export function useAdminElevation() {
  const context = useContext(AdminElevationContext);
  if (!context) {
    throw new Error('useAdminElevation must be used within AdminElevationProvider');
  }
  return context;
}
