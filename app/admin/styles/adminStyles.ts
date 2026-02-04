/**
 * Admin Panel Styles
 *
 * Centralized styles for the admin dashboard.
 * Uses brand colors from @/lib/colors for consistency.
 *
 * Color reference:
 * - Primary Orange: #FF8200 (Pantone 151 C)
 * - Cream Yellow: #FBDB65 (Pantone 120 C) - for titles/headings
 * - rgba(255, 130, 0, alpha) - for transparent orange
 */

export const adminStyles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #111827, #1f2937)',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '900',
    color: '#FBDB65', // Pantone 120 C - Cream Yellow
    marginBottom: '8px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '16px',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#FBDB65',
    textDecoration: 'none',
    marginBottom: '20px',
    padding: '8px 16px',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '8px',
    transition: 'all 0.2s',
    background: 'transparent',
    cursor: 'pointer',
  },
  section: {
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '12px',
    padding: '32px',
    backdropFilter: 'blur(10px)',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#FBDB65',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableContainer: {
    overflowX: 'auto' as const,
    borderRadius: '8px',
    border: '1px solid rgba(255, 130, 0, 0.2)',
    position: 'relative' as const,
  },
  tableHeader: {
    padding: '16px',
    textAlign: 'left' as const,
    fontWeight: '600',
    color: '#FBDB65',
    fontSize: '14px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    background: 'rgba(255, 130, 0, 0.1)',
    borderBottom: '2px solid rgba(255, 130, 0, 0.3)',
  },
  tableHeaderCell: {
    padding: '12px',
    textAlign: 'left' as const,
    fontWeight: '600',
    color: '#FBDB65',
    fontSize: '14px',
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 130, 0, 0.2)',
    transition: 'background 0.2s',
  },
  tableCell: {
    padding: '12px',
    color: '#e2e8f0',
    fontSize: '14px',
  },
  button: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    fontSize: '14px',
  },
  primaryButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    fontSize: '14px',
  },
  secondaryButton: {
    padding: '8px 16px',
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#FBDB65',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
  },
  outlineButton: {
    padding: '8px 16px',
    background: 'transparent',
    color: '#FBDB65',
    border: '2px solid rgba(255, 130, 0, 0.5)',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
  },
  dangerButton: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    fontSize: '14px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    background: 'rgba(17, 24, 39, 0.8)',
    color: '#f3f4f6',
    fontSize: '16px',
    transition: 'all 0.2s',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '8px',
    display: 'block',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '12px',
    padding: '24px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.2s',
  },
  badge: {
    padding: '4px 12px',
    background: 'rgba(255, 130, 0, 0.2)',
    border: '1px solid rgba(255, 130, 0, 0.5)',
    borderRadius: '16px',
    fontSize: '12px',
    color: '#FBDB65',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '24px',
  },
  textarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    background: 'rgba(17, 24, 39, 0.8)',
    color: '#f3f4f6',
    fontSize: '16px',
    transition: 'all 0.2s',
    width: '100%',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  select: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    background: 'rgba(17, 24, 39, 0.8)',
    color: '#f3f4f6',
    fontSize: '16px',
    transition: 'all 0.2s',
    width: '100%',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  checkbox: {
    marginRight: '8px',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    color: '#e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
  },
  iconButton: {
    padding: '8px',
    background: 'transparent',
    border: '1px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '6px',
    color: '#FBDB65',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(17, 24, 39, 0.8)',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '8px',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#e2e8f0',
    fontSize: '16px',
    outline: 'none',
  },
  // Hover effects - use brand orange rgba(255, 130, 0, alpha)
  hoverEffects: {
    button: {
      onMouseEnter: (e: any) => e.currentTarget.style.transform = 'scale(1.05)',
      onMouseLeave: (e: any) => e.currentTarget.style.transform = 'scale(1)',
    },
    card: {
      onMouseEnter: (e: any) => {
        e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.5)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 130, 0, 0.2)';
      },
      onMouseLeave: (e: any) => {
        e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.3)';
        e.currentTarget.style.boxShadow = 'none';
      },
    },
    row: {
      onMouseEnter: (e: any) => e.currentTarget.style.background = 'rgba(255, 130, 0, 0.05)',
      onMouseLeave: (e: any) => e.currentTarget.style.background = 'transparent',
    },
  },
};
