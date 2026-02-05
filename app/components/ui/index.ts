/**
 * Shared UI Components
 * ====================
 * Central export for all reusable UI components.
 *
 * ⚠️ AI MAINTAINER INSTRUCTIONS:
 * ------------------------------
 * Import shared UI components from this barrel export:
 *
 * ```typescript
 * import { EmptyState, Spinner, SkeletonGrid, LoadingSection } from '@/app/components/ui';
 * ```
 *
 * Available components:
 * - EmptyState         : For "no data" states (cart, orders, search results)
 * - Spinner            : Animated loading spinner
 * - SkeletonCard       : Placeholder for loading cards
 * - SkeletonText       : Placeholder for loading text
 * - ProductCardSkeleton: Complete product card placeholder
 * - SkeletonGrid       : Grid of skeleton cards
 * - LoadingPage        : Full-page loading state
 * - LoadingSection     : Section-level loading state
 *
 * DO NOT create inline loading/empty states - always use these shared components.
 */

export { default as EmptyState } from './EmptyState';
export type { EmptyStateVariant } from './EmptyState';

export {
  default as LoadingState,
  Spinner,
  SkeletonCard,
  SkeletonText,
  ProductCardSkeleton,
  LoadingPage,
  LoadingSection,
  SkeletonGrid,
} from './LoadingState';
