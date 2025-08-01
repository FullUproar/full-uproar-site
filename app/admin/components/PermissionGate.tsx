'use client';

import React from 'react';
import { usePermission } from '@/lib/hooks/usePermission';
import { AlertCircle } from 'lucide-react';

interface PermissionGateProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGate({ 
  resource, 
  action, 
  children, 
  fallback 
}: PermissionGateProps) {
  const { hasPermission, loading } = usePermission(resource, action);

  if (loading) {
    return (
      <div style={{ 
        padding: '24px', 
        textAlign: 'center',
        color: '#94a3b8' 
      }}>
        Checking permissions...
      </div>
    );
  }

  if (!hasPermission) {
    return fallback || (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        <AlertCircle size={48} style={{ 
          margin: '0 auto 16px', 
          opacity: 0.5,
          color: '#ef4444' 
        }} />
        <h3 style={{ 
          color: '#ef4444', 
          marginBottom: '8px',
          fontSize: '18px' 
        }}>
          Access Denied
        </h3>
        <p>You don't have permission to access this resource.</p>
      </div>
    );
  }

  return <>{children}</>;
}