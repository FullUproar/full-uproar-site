/**
 * Forum Styles
 * Toned-down color palette for better usability while maintaining brand identity
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================
export const forumColors = {
  // Backgrounds (layered for depth)
  bgPage: '#0f172a',              // Darker base
  bgCard: '#1e293b',              // Card backgrounds
  bgCardHover: '#334155',         // Hover state
  bgSection: 'rgba(30, 41, 59, 0.6)',
  bgThreadRow: 'rgba(30, 41, 59, 0.5)',
  bgThreadRowHover: 'rgba(51, 65, 85, 0.7)',

  // Borders (more visible - higher opacity)
  borderDefault: 'rgba(71, 85, 105, 0.5)',
  borderHover: 'rgba(255, 130, 0, 0.5)',
  borderAccent: 'rgba(255, 130, 0, 0.3)',
  borderSubtle: 'rgba(71, 85, 105, 0.3)',

  // Text colors
  textTitle: '#e2e8f0',           // Cooler tone for titles (NOT orange)
  textPrimary: '#cbd5e1',         // Main content text
  textSecondary: '#94a3b8',       // Metadata, timestamps
  textMuted: '#64748b',           // Very subtle text

  // Accent colors (used sparingly)
  accentOrange: '#FF8200',        // CTAs, important actions ONLY
  accentOrangeMuted: '#ea580c',
  accentOrangeText: '#FBDB65',    // Orange text when needed (sparingly)
  accentOrangeGlow: 'rgba(255, 130, 0, 0.15)',

  // Status colors
  pinned: '#eab308',
  locked: '#dc2626',
  online: '#22c55e',

  // Trust level badges
  trustNew: '#64748b',
  trustBasic: '#3b82f6',
  trustMember: '#10b981',
  trustRegular: '#f59e0b',
  trustLeader: '#ef4444',

  // Access level colors
  accessPublic: '#22c55e',
  accessMembers: '#3b82f6',
  accessSubscribers: '#7D55C7',
  accessPrivate: '#ef4444',
};

// =============================================================================
// COMPONENT STYLES
// =============================================================================
export const forumStyles = {
  // Page container
  container: {
    minHeight: '100vh',
    background: `linear-gradient(180deg, ${forumColors.bgPage} 0%, #1a1a2e 100%)`,
    color: forumColors.textPrimary,
    padding: '24px',
  },

  // Content wrapper
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
  },

  // Header section
  header: {
    marginBottom: '32px',
  },

  headerTitle: {
    fontSize: '32px',
    fontWeight: '800',
    color: forumColors.textTitle,
    marginBottom: '8px',
  },

  headerSubtitle: {
    fontSize: '16px',
    color: forumColors.textSecondary,
  },

  // Category section
  categorySection: {
    marginBottom: '32px',
  },

  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: forumColors.bgCard,
    borderRadius: '12px 12px 0 0',
    borderBottom: `2px solid ${forumColors.borderAccent}`,
  },

  categoryIcon: {
    fontSize: '24px',
  },

  categoryName: {
    fontSize: '18px',
    fontWeight: '700',
    color: forumColors.textTitle,
  },

  categoryDescription: {
    fontSize: '14px',
    color: forumColors.textSecondary,
    marginLeft: 'auto',
  },

  // Board card
  boardCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: forumColors.bgSection,
    borderLeft: `3px solid transparent`,
    borderBottom: `1px solid ${forumColors.borderSubtle}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  boardCardHover: {
    background: forumColors.bgCardHover,
    borderLeftColor: forumColors.accentOrange,
  },

  boardCardLast: {
    borderRadius: '0 0 12px 12px',
    borderBottom: 'none',
  },

  boardIcon: {
    fontSize: '28px',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 130, 0, 0.1)',
    borderRadius: '10px',
  },

  boardInfo: {
    flex: 1,
  },

  boardName: {
    fontSize: '16px',
    fontWeight: '600',
    color: forumColors.textTitle,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  boardDescription: {
    fontSize: '13px',
    color: forumColors.textSecondary,
  },

  boardStats: {
    display: 'flex',
    gap: '24px',
    color: forumColors.textMuted,
    fontSize: '13px',
  },

  boardStatItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },

  boardStatValue: {
    fontWeight: '600',
    color: forumColors.textSecondary,
    fontSize: '16px',
  },

  boardStatLabel: {
    fontSize: '11px',
    color: forumColors.textMuted,
    textTransform: 'uppercase' as const,
  },

  boardLastPost: {
    textAlign: 'right' as const,
    minWidth: '200px',
  },

  // Thread row
  threadRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 20px',
    background: forumColors.bgThreadRow,
    borderBottom: `1px solid ${forumColors.borderSubtle}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },

  threadRowHover: {
    background: forumColors.bgThreadRowHover,
    borderLeftColor: forumColors.accentOrange,
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid' as const,
    paddingLeft: '17px',
  },

  threadTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: forumColors.textTitle,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },

  threadMeta: {
    fontSize: '12px',
    color: forumColors.textSecondary,
  },

  threadStats: {
    display: 'flex',
    gap: '16px',
    color: forumColors.textMuted,
    fontSize: '13px',
  },

  // Access badge
  accessBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  accessBadgePublic: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: forumColors.accessPublic,
    border: `1px solid rgba(34, 197, 94, 0.3)`,
  },

  accessBadgeMembers: {
    background: 'rgba(59, 130, 246, 0.15)',
    color: forumColors.accessMembers,
    border: `1px solid rgba(59, 130, 246, 0.3)`,
  },

  accessBadgeSubscribers: {
    background: 'rgba(139, 92, 246, 0.15)',
    color: forumColors.accessSubscribers,
    border: `1px solid rgba(139, 92, 246, 0.3)`,
  },

  accessBadgePrivate: {
    background: 'rgba(239, 68, 68, 0.15)',
    color: forumColors.accessPrivate,
    border: `1px solid rgba(239, 68, 68, 0.3)`,
  },

  // Status badges
  pinnedBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(234, 179, 8, 0.15)',
    color: forumColors.pinned,
    border: `1px solid rgba(234, 179, 8, 0.3)`,
  },

  lockedBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(220, 38, 38, 0.15)',
    color: forumColors.locked,
    border: `1px solid rgba(220, 38, 38, 0.3)`,
  },

  // Trust level badges
  trustBadge: {
    fontSize: '9px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '3px',
    textTransform: 'uppercase' as const,
  },

  // Buttons
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: forumColors.accentOrange,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    background: 'transparent',
    color: forumColors.accentOrange,
    border: `2px solid ${forumColors.borderAccent}`,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // Cards (for stats, etc.)
  card: {
    background: forumColors.bgCard,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${forumColors.borderDefault}`,
  },

  // Empty state
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    color: forumColors.textSecondary,
  },

  // Breadcrumb
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: forumColors.textSecondary,
    marginBottom: '24px',
  },

  breadcrumbLink: {
    color: forumColors.textSecondary,
    textDecoration: 'none',
    transition: 'color 0.15s',
  },

  breadcrumbLinkHover: {
    color: forumColors.accentOrangeText,
  },

  breadcrumbSeparator: {
    color: forumColors.textMuted,
  },

  breadcrumbCurrent: {
    color: forumColors.textTitle,
    fontWeight: '500',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================
export function getAccessBadgeStyle(accessLevel: string) {
  switch (accessLevel) {
    case 'MEMBERS_ONLY':
      return { ...forumStyles.accessBadge, ...forumStyles.accessBadgeMembers };
    case 'SUBSCRIBERS_ONLY':
      return { ...forumStyles.accessBadge, ...forumStyles.accessBadgeSubscribers };
    case 'PRIVATE':
      return { ...forumStyles.accessBadge, ...forumStyles.accessBadgePrivate };
    default:
      return null; // No badge for public
  }
}

export function getAccessBadgeText(accessLevel: string) {
  switch (accessLevel) {
    case 'MEMBERS_ONLY':
      return 'Members';
    case 'SUBSCRIBERS_ONLY':
      return 'Afterroar+';
    case 'PRIVATE':
      return 'Invite Only';
    default:
      return null;
  }
}

export function getTrustLevelStyle(trustLevel: number) {
  const colors = [
    forumColors.trustNew,
    forumColors.trustBasic,
    forumColors.trustMember,
    forumColors.trustRegular,
    forumColors.trustLeader,
  ];
  const color = colors[trustLevel] || colors[0];

  return {
    ...forumStyles.trustBadge,
    background: `${color}20`,
    color: color,
    border: `1px solid ${color}40`,
  };
}

export function getTrustLevelName(trustLevel: number): string {
  const names = ['New', 'Basic', 'Member', 'Regular', 'Leader'];
  return names[trustLevel] || 'New';
}
