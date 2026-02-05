/**
 * Admin Panel Styles - Mobile-First Responsive
 *
 * Design principles:
 * - Mobile-first: Base styles work on phones
 * - Touch-friendly: Min 44px touch targets
 * - Sober palette: Gray/white text, orange for actions only
 * - Dark theme: #0a0a0a base
 */

export const adminStyles = {
  // Layout
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    padding: '16px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: '4px',
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px',
  },

  // Sections
  section: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '16px',
  },

  // Cards
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    padding: '16px',
  },

  // Grid - single column on mobile, auto-fit on desktop
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
  gridResponsive: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },

  // Tables
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableContainer: {
    overflowX: 'auto' as const,
    borderRadius: '8px',
    border: '1px solid #222',
  },
  tableHeader: {
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: '600',
    color: '#94a3b8',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    background: '#111',
    borderBottom: '1px solid #222',
  },
  tableHeaderCell: {
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: '600',
    color: '#94a3b8',
    fontSize: '12px',
  },
  tableRow: {
    borderBottom: '1px solid #1a1a1a',
  },
  tableCell: {
    padding: '12px',
    color: '#e2e8f0',
    fontSize: '14px',
  },

  // Buttons - touch-friendly 44px+ height
  button: {
    padding: '12px 16px',
    minHeight: '44px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  primaryButton: {
    padding: '12px 20px',
    minHeight: '44px',
    background: '#f97316',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  secondaryButton: {
    padding: '12px 16px',
    minHeight: '44px',
    background: 'transparent',
    color: '#e2e8f0',
    border: '1px solid #333',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  outlineButton: {
    padding: '12px 16px',
    minHeight: '44px',
    background: 'transparent',
    color: '#f97316',
    border: '1px solid #f97316',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  dangerButton: {
    padding: '12px 16px',
    minHeight: '44px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  iconButton: {
    padding: '10px',
    minWidth: '44px',
    minHeight: '44px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form elements - touch-friendly
  input: {
    padding: '12px',
    minHeight: '44px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#0a0a0a',
    color: '#e2e8f0',
    fontSize: '16px', // Prevents iOS zoom
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#0a0a0a',
    color: '#e2e8f0',
    fontSize: '16px',
    width: '100%',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    minHeight: '100px',
  },
  select: {
    padding: '12px',
    minHeight: '44px',
    borderRadius: '6px',
    border: '1px solid #333',
    background: '#0a0a0a',
    color: '#e2e8f0',
    fontSize: '16px',
    width: '100%',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: '6px',
    display: 'block',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    marginBottom: '16px',
  },

  // Checkbox - larger touch target
  checkbox: {
    marginRight: '10px',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    color: '#e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
    minHeight: '44px',
  },

  // Badge
  badge: {
    padding: '4px 8px',
    background: 'rgba(249, 115, 22, 0.15)',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#f97316',
    fontWeight: '500',
  },

  // Search
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '6px',
    minHeight: '44px',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#e2e8f0',
    fontSize: '16px',
    outline: 'none',
  },

  // Back button
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    marginBottom: '16px',
    padding: '12px 16px',
    minHeight: '44px',
    border: '1px solid #333',
    borderRadius: '6px',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
  },

  // Hover effects (for desktop)
  hoverEffects: {
    button: {
      onMouseEnter: (e: any) => {
        e.currentTarget.style.opacity = '0.9';
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.opacity = '1';
      },
    },
    card: {
      onMouseEnter: (e: any) => {
        e.currentTarget.style.borderColor = '#333';
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.borderColor = '#222';
      },
    },
    row: {
      onMouseEnter: (e: any) => {
        e.currentTarget.style.background = '#1a1a1a';
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.background = 'transparent';
      },
    },
  },
};

// CSS for responsive overrides (inject in layout or component)
export const adminResponsiveCSS = `
  @media (min-width: 640px) {
    .admin-container { padding: 24px; }
    .admin-title { font-size: 28px; }
    .admin-section { padding: 24px; }
    .admin-form-row { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .admin-container { padding: 32px; }
    .admin-title { font-size: 32px; }
  }
`;
