'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, AlertCircle, Frown } from 'lucide-react';
import { LOADING_MESSAGES, ERROR_MESSAGES, EMPTY_STATES } from './constants';

// =============================================================================
// SHARED STYLES
// =============================================================================

const baseStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#e2e8f0',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center' as const,
    maxWidth: '400px',
    width: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fdba74',
    marginBottom: '12px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '16px',
    marginBottom: '24px',
    lineHeight: 1.5,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textDecoration: 'none',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#000',
    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
  },
  secondaryButton: {
    background: 'rgba(249, 115, 22, 0.1)',
    border: '2px solid rgba(249, 115, 22, 0.3)',
    color: '#fdba74',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  backButton: {
    position: 'absolute' as const,
    top: '20px',
    left: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
};

// =============================================================================
// LOADING STATE COMPONENT
// =============================================================================

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingState({
  message = LOADING_MESSAGES.DEFAULT,
  fullPage = true
}: LoadingStateProps) {
  const content = (
    <>
      <Loader2
        size={48}
        style={{ color: '#f97316', animation: 'spin 1s linear infinite' }}
      />
      <p style={{ color: '#94a3b8', marginTop: '16px', fontSize: '18px' }}>
        {message}
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );

  if (fullPage) {
    return (
      <div style={baseStyles.container}>
        {content}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
    }}>
      {content}
    </div>
  );
}

// =============================================================================
// ERROR STATE COMPONENT
// =============================================================================

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Oops!',
  message = ERROR_MESSAGES.GENERIC,
  actionLabel = 'Go Back',
  actionHref = '/game-kit',
  onRetry,
}: ErrorStateProps) {
  return (
    <div style={baseStyles.container}>
      <div style={baseStyles.card}>
        <div style={baseStyles.icon}>
          <Frown size={48} style={{ color: '#ef4444' }} />
        </div>
        <h1 style={{ ...baseStyles.title, color: '#ef4444' }}>{title}</h1>
        <p style={baseStyles.subtitle}>{message}</p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{ ...baseStyles.button, ...baseStyles.primaryButton }}
            >
              Try Again
            </button>
          )}
          <Link
            href={actionHref}
            style={{ ...baseStyles.button, ...baseStyles.secondaryButton }}
          >
            <ArrowLeft size={18} />
            {actionLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: '#94a3b8',
    }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>{icon}</div>
      <h3 style={{ color: '#e2e8f0', marginBottom: '8px', fontSize: '20px' }}>
        {title}
      </h3>
      <p style={{ marginBottom: '24px' }}>{description}</p>

      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link
            href={actionHref}
            style={{ ...baseStyles.button, ...baseStyles.primaryButton, textDecoration: 'none' }}
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            style={{ ...baseStyles.button, ...baseStyles.primaryButton }}
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

// =============================================================================
// BACK BUTTON COMPONENT
// =============================================================================

interface BackButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export function BackButton({
  href = '/game-kit',
  label = 'Back',
  onClick,
}: BackButtonProps) {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={{
          ...baseStyles.backButton,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={18} />
        {label}
      </button>
    );
  }

  return (
    <Link href={href} style={baseStyles.backButton}>
      <ArrowLeft size={18} />
      {label}
    </Link>
  );
}

// =============================================================================
// SAVE STATUS INDICATOR
// =============================================================================

interface SaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
}

export function SaveStatus({ status }: SaveStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'saving':
        return { icon: <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />, text: 'Saving...', color: '#fdba74' };
      case 'saved':
        return { icon: '✓', text: 'Saved!', color: '#22c55e' };
      case 'error':
        return { icon: <AlertCircle size={14} />, text: 'Save failed', color: '#ef4444' };
      default:
        return null;
    }
  };

  const info = getStatusInfo();
  if (!info) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      color: info.color,
      padding: '4px 8px',
      borderRadius: '6px',
      background: `${info.color}15`,
    }}>
      {info.icon}
      {info.text}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// PLAYER COUNT BADGE
// =============================================================================

interface PlayerCountProps {
  current: number;
  min?: number;
  max?: number;
}

export function PlayerCount({ current, min, max }: PlayerCountProps) {
  const isSufficient = min ? current >= min : true;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '20px',
      background: isSufficient ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      border: `1px solid ${isSufficient ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
      color: isSufficient ? '#4ade80' : '#f87171',
      fontSize: '14px',
      fontWeight: 'bold',
    }}>
      👥 {current}
      {min && max && (
        <span style={{ fontWeight: 'normal', opacity: 0.7 }}>
          / {min}-{max}
        </span>
      )}
    </div>
  );
}
