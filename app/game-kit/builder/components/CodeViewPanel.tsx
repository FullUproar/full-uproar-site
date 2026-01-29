'use client';

import React, { useState, useCallback } from 'react';
import { Copy, Download, Check, Code } from 'lucide-react';
import SyntaxHighlighter from './SyntaxHighlighter';

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(15, 23, 42, 0.6)',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
    background: 'rgba(30, 41, 59, 0.4)',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fdba74',
  },
  badge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(249, 115, 22, 0.2)',
    color: '#f97316',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    background: 'rgba(249, 115, 22, 0.1)',
    color: '#fdba74',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  codeContainer: {
    flex: 1,
    overflow: 'auto',
    background: 'rgba(10, 10, 10, 0.8)',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    gap: '12px',
    padding: '48px',
    textAlign: 'center' as const,
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

interface CodeViewPanelProps {
  code: string;
  gameName: string;
  onClose?: () => void;
}

export default function CodeViewPanel({ code, gameName, onClose }: CodeViewPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${gameName.toLowerCase().replace(/\s+/g, '-')}.fus`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [code, gameName]);

  const lineCount = code.split('\n').length;

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <div style={styles.title}>
            <Code size={16} />
            FuScript
          </div>
          <span style={styles.badge}>
            {lineCount} lines
          </span>
        </div>

        <div style={styles.toolbarRight}>
          <button
            style={styles.button}
            onClick={handleCopy}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)';
              e.currentTarget.style.borderColor = '#f97316';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
            }}
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: '#10b981' }} />
                <span style={{ color: '#10b981' }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy
              </>
            )}
          </button>

          <button
            style={styles.button}
            onClick={handleDownload}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.2)';
              e.currentTarget.style.borderColor = '#f97316';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)';
            }}
          >
            <Download size={14} />
            Download .fus
          </button>
        </div>
      </div>

      {/* Code Display */}
      {code ? (
        <div style={styles.codeContainer}>
          <SyntaxHighlighter code={code} showLineNumbers={true} />
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Code size={48} style={{ opacity: 0.5 }} />
          <div style={{ fontSize: '16px', fontWeight: '500' }}>No game definition yet</div>
          <div style={{ fontSize: '14px' }}>
            Add components and game flow blocks to see the code view
          </div>
        </div>
      )}
    </div>
  );
}
