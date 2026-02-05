'use client';

import React from 'react';
import { colors } from '@/lib/colors';
import { typography } from '@/lib/design-system/typography';
import { spacing } from '@/lib/design-system/spacing';

/**
 * LoadingState Components
 * =======================
 * Shared components for displaying loading states consistently.
 *
 * ⚠️ AI MAINTAINER INSTRUCTIONS:
 * ------------------------------
 * Use these components for ALL loading states. NEVER create inline loading UI.
 *
 * Available components:
 * - Spinner              : Animated spinner (small/medium/large)
 * - SkeletonCard         : Placeholder for cards/images
 * - SkeletonText         : Placeholder for text lines
 * - ProductCardSkeleton  : Full product card skeleton
 * - SkeletonGrid         : Grid of ProductCardSkeletons
 * - LoadingPage          : Full-page loading state
 * - LoadingSection       : Section-level loading state
 *
 * Usage:
 * ```typescript
 * import {
 *   Spinner,
 *   SkeletonGrid,
 *   LoadingSection,
 *   ProductCardSkeleton
 * } from '@/app/components/ui';
 *
 * // Grid of skeleton cards (for product listings)
 * <SkeletonGrid count={8} columns={4} />
 *
 * // Section loading with message
 * <LoadingSection message="Loading games..." height="400px" />
 *
 * // Simple spinner
 * <Spinner size="large" />
 *
 * // Full page loading
 * <LoadingPage message="Loading your cart..." />
 * ```
 */

// Spinner component
interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export function Spinner({ size = 'medium', color = colors.primary }: SpinnerProps) {
  const sizeMap = {
    small: 20,
    medium: 32,
    large: 48,
  };

  const pixelSize = sizeMap[size];

  return (
    <div
      style={{
        width: pixelSize,
        height: pixelSize,
        border: `3px solid rgba(255, 130, 0, 0.2)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Skeleton loader for cards
interface SkeletonCardProps {
  width?: string;
  height?: string;
}

export function SkeletonCard({ width = '100%', height = '300px' }: SkeletonCardProps) {
  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, rgba(255,130,0,0.05) 25%, rgba(255,130,0,0.1) 50%, rgba(255,130,0,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '12px',
        border: '2px solid rgba(255, 130, 0, 0.1)',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// Skeleton text line
interface SkeletonTextProps {
  width?: string;
  height?: string;
}

export function SkeletonText({ width = '100%', height = '1rem' }: SkeletonTextProps) {
  return (
    <div
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, rgba(255,130,0,0.05) 25%, rgba(255,130,0,0.1) 50%, rgba(255,130,0,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div
      style={{
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: '12px',
        border: '2px solid rgba(255, 130, 0, 0.1)',
        padding: spacing.md,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
      }}
    >
      {/* Image placeholder */}
      <SkeletonCard height="200px" />

      {/* Title */}
      <SkeletonText width="80%" height="1.5rem" />

      {/* Description */}
      <SkeletonText width="100%" />
      <SkeletonText width="60%" />

      {/* Price & button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.sm }}>
        <SkeletonText width="80px" height="2rem" />
        <SkeletonText width="100px" height="2.5rem" />
      </div>
    </div>
  );
}

// Full page loading state
interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #111827, #1f2937)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
      }}
    >
      <Spinner size="large" />
      <p
        style={{
          ...typography.bodyLarge,
          color: colors.creamYellow,
        }}
      >
        {message}
      </p>
    </div>
  );
}

// Section loading state (for parts of page)
interface LoadingSectionProps {
  message?: string;
  height?: string;
}

export function LoadingSection({ message = 'Loading...', height = '200px' }: LoadingSectionProps) {
  return (
    <div
      style={{
        minHeight: height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        padding: spacing.xl,
      }}
    >
      <Spinner size="medium" />
      <p
        style={{
          ...typography.body,
          color: colors.creamYellow,
        }}
      >
        {message}
      </p>
    </div>
  );
}

// Grid of skeleton cards (for product grids)
interface SkeletonGridProps {
  count?: number;
  columns?: number;
}

export function SkeletonGrid({ count = 4, columns = 4 }: SkeletonGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: spacing.lg,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Default export for backwards compatibility
export default function LoadingState({ message }: { message?: string }) {
  return <LoadingSection message={message} />;
}
