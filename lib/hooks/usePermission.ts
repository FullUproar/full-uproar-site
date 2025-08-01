'use client';

import { useState, useEffect } from 'react';

export function usePermission(resource: string, action: string) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await fetch('/api/admin/check-permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource, action })
        });
        
        const data = await response.json();
        setHasPermission(data.hasPermission);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [resource, action]);

  return { hasPermission, loading };
}