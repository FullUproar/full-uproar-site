'use client';

import React from 'react';
import { Package, ShoppingCart, FileText, Inbox, Search, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { colors } from '@/lib/colors';
import { typography } from '@/lib/design-system/typography';
import { spacing } from '@/lib/design-system/spacing';
import { buttonStyles } from '@/lib/design-system/buttons';

/**
 * EmptyState Component
 *
 * Consistent empty state UI across the application.
 * Use when there's no data to display (empty cart, no orders, no results, etc.)
 */

type EmptyStateVariant = 'cart' | 'orders' | 'products' | 'search' | 'games' | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: React.ElementType;
  defaultTitle: string;
  defaultMessage: string;
  defaultAction?: { label: string; href: string };
}> = {
  cart: {
    icon: ShoppingCart,
    defaultTitle: 'Your cart is empty',
    defaultMessage: 'Looks like you haven\'t added any chaos to your cart yet.',
    defaultAction: { label: 'Browse Games', href: '/shop/games' },
  },
  orders: {
    icon: FileText,
    defaultTitle: 'No orders yet',
    defaultMessage: 'You haven\'t placed any orders. Time to unleash some chaos!',
    defaultAction: { label: 'Start Shopping', href: '/shop' },
  },
  products: {
    icon: Package,
    defaultTitle: 'No products found',
    defaultMessage: 'There are no products in this category yet.',
    defaultAction: { label: 'View All Products', href: '/shop' },
  },
  search: {
    icon: Search,
    defaultTitle: 'No results found',
    defaultMessage: 'We couldn\'t find anything matching your search. Try different keywords.',
  },
  games: {
    icon: Gamepad2,
    defaultTitle: 'No games available',
    defaultMessage: 'Check back soon for more chaotic games!',
    defaultAction: { label: 'Go Home', href: '/' },
  },
  generic: {
    icon: Inbox,
    defaultTitle: 'Nothing here',
    defaultMessage: 'This area is empty.',
  },
};

export default function EmptyState({
  variant = 'generic',
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;
  const displayAction = actionLabel
    ? { label: actionLabel, href: actionHref }
    : config.defaultAction;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing['3xl'],
        textAlign: 'center',
        minHeight: '300px',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(255, 130, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Icon size={40} style={{ color: colors.primary }} />
      </div>

      <h3
        style={{
          ...typography.h3,
          color: colors.creamYellow,
          marginBottom: spacing.sm,
        }}
      >
        {displayTitle}
      </h3>

      <p
        style={{
          ...typography.body,
          color: colors.textSecondary,
          maxWidth: '400px',
          marginBottom: displayAction ? spacing.xl : 0,
        }}
      >
        {displayMessage}
      </p>

      {displayAction && (
        onAction ? (
          <button
            onClick={onAction}
            style={buttonStyles.primaryMedium}
          >
            {displayAction.label}
          </button>
        ) : displayAction.href ? (
          <Link
            href={displayAction.href}
            style={{
              ...buttonStyles.primaryMedium,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {displayAction.label}
          </Link>
        ) : null
      )}
    </div>
  );
}

// Export variant type for external use
export type { EmptyStateVariant };
