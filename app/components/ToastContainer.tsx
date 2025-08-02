'use client';

import { useToastStore } from '@/lib/toastStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getIcon = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStyles = (type: 'success' | 'error' | 'info') => {
    const base = 'fixed right-4 z-50 min-w-[300px] max-w-[400px] bg-gray-900 rounded-lg shadow-xl border-2 p-4 flex items-start gap-3 animate-slide-in';
    switch (type) {
      case 'success':
        return `${base} border-green-500/50`;
      case 'error':
        return `${base} border-red-500/50`;
      case 'info':
        return `${base} border-blue-500/50`;
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slide-out {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-slide-out {
          animation: slide-out 0.3s ease-out;
        }
      `}</style>
      
      <div className="fixed top-20 right-4 z-50 space-y-3">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className={getStyles(toast.type)}
            style={{ top: `${index * 80 + 20}px` }}
          >
            {getIcon(toast.type)}
            <div className="flex-1">
              <p className="text-white font-medium">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}