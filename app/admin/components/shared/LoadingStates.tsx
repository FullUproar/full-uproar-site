/**
 * Reusable loading state components with skeletons and spinners
 */

import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

// ============================================================================
// SPINNER COMPONENTS
// ============================================================================

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export function Spinner({ size = 'medium', color = '#f97316', className }: SpinnerProps) {
  const sizes = {
    small: 16,
    medium: 24,
    large: 48,
  };

  return (
    <Loader2
      size={sizes[size]}
      className={className}
      style={{
        color,
        animation: 'spin 1s linear infinite',
      }}
    />
  );
}

// ============================================================================
// FULL PAGE LOADING
// ============================================================================

interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = 'Loading...' }: FullPageLoadingProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
    }}>
      <Spinner size="large" />
      <p style={{
        marginTop: '20px',
        color: '#94a3b8',
        fontSize: '16px',
      }}>
        {message}
      </p>
    </div>
  );
}

// ============================================================================
// INLINE LOADING
// ============================================================================

interface InlineLoadingProps {
  text?: string;
}

export function InlineLoading({ text = 'Loading' }: InlineLoadingProps) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: '#94a3b8',
    }}>
      <Spinner size="small" color="#94a3b8" />
      <span>{text}</span>
    </div>
  );
}

// ============================================================================
// SKELETON LOADERS
// ============================================================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className,
  style 
}: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(148, 163, 184, 0.1) 0%, rgba(148, 163, 184, 0.2) 50%, rgba(148, 163, 184, 0.1) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      padding: '20px',
      background: 'rgba(30, 41, 59, 0.8)',
      borderRadius: '12px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="150px" height="20px" style={{ marginBottom: '8px' }} />
          <Skeleton width="100px" height="14px" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '16px',
        padding: '12px 16px',
        borderBottom: '2px solid rgba(249, 115, 22, 0.3)',
      }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="16px" width="80%" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              height="20px"
              width={colIndex === 0 ? '100%' : '60%'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  blur?: boolean;
}

export function LoadingOverlay({ visible, message, blur = true }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: blur ? 'rgba(10, 10, 10, 0.8)' : 'transparent',
      backdropFilter: blur ? 'blur(4px)' : 'none',
      zIndex: 100,
      pointerEvents: visible ? 'auto' : 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s',
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        padding: '20px 30px',
        borderRadius: '12px',
        border: '2px solid rgba(249, 115, 22, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
      }}>
        <Spinner size="medium" />
        {message && (
          <p style={{
            color: '#e2e8f0',
            fontSize: '14px',
            margin: 0,
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LOADING BUTTON
// ============================================================================

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
}

export function LoadingButton({
  loading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  icon,
  variant = 'primary',
  size = 'medium',
  style,
  ...props
}: LoadingButtonProps) {
  const variants = {
    primary: 'linear-gradient(135deg, #f97316, #ea580c)',
    secondary: 'rgba(148, 163, 184, 0.1)',
    danger: 'linear-gradient(135deg, #ef4444, #dc2626)',
    success: 'linear-gradient(135deg, #10b981, #059669)',
  };

  const sizes = {
    small: { padding: '6px 12px', fontSize: '12px' },
    medium: { padding: '10px 20px', fontSize: '14px' },
    large: { padding: '14px 28px', fontSize: '16px' },
  };

  return (
    <button
      disabled={loading || disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: variants[variant],
        border: 'none',
        borderRadius: '8px',
        color: '#fff',
        fontWeight: '500',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: loading || disabled ? 0.6 : 1,
        transition: 'all 0.2s',
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="small" color="#fff" />
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

// ============================================================================
// REFRESH BUTTON
// ============================================================================

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function RefreshButton({ onRefresh, loading = false, size = 'medium' }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const sizes = {
    small: 16,
    medium: 20,
    large: 24,
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading || isRefreshing}
      style={{
        background: 'transparent',
        border: 'none',
        color: '#94a3b8',
        cursor: loading || isRefreshing ? 'not-allowed' : 'pointer',
        padding: '8px',
        borderRadius: '4px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.color = '#fdba74'}
      onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
    >
      <RefreshCw
        size={sizes[size]}
        style={{
          animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
        }}
      />
    </button>
  );
}

// ============================================================================
// LAZY LOAD WRAPPER
// ============================================================================

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

export function LazyLoad({ children, fallback, delay = 200 }: LazyLoadProps) {
  const [showFallback, setShowFallback] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(false);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (showFallback) {
    return <>{fallback || <SkeletonCard />}</>;
  }

  return <>{children}</>;
}

// ============================================================================
// CSS ANIMATIONS
// ============================================================================

// Add this to your global CSS or styled-components
const styles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.getElementById('loading-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'loading-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}