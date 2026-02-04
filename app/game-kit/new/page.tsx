'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { adminStyles } from '@/app/admin/styles/adminStyles';
import { gameKitResponsiveCSS } from '@/lib/game-kit/responsive-styles';
import { useToastStore } from '@/lib/toastStore';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/game-kit/constants';

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  iconEmoji: string | null;
  cardTypes: string[];
  isOfficial: boolean;
}

const styles = {
  ...adminStyles,
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  templateCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(255, 130, 0, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  templateIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  templateName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#e2e8f0',
    marginBottom: '8px',
  },
  templateDescription: {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  templateCardTypes: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  cardTypeBadge: {
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500',
  },
  modal: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: 'linear-gradient(to bottom, #1e293b, #0f172a)',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '500px',
    width: '100%',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    color: '#FBDB65',
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(15, 23, 42, 0.8)',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '16px',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: '80px',
    boxSizing: 'border-box' as const,
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '12px 24px',
    background: 'transparent',
    border: '2px solid rgba(255, 130, 0, 0.3)',
    borderRadius: '8px',
    color: '#FBDB65',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

const cardTypeColors: Record<string, { bg: string; color: string }> = {
  black: { bg: '#1a1a1a', color: '#ffffff' },
  white: { bg: '#ffffff', color: '#1a1a1a' },
  question: { bg: '#3b82f6', color: '#ffffff' },
  answer: { bg: '#22c55e', color: '#ffffff' },
  number: { bg: '#ef4444', color: '#ffffff' },
  action: { bg: '#eab308', color: '#1a1a1a' },
  wild: { bg: '#1a1a1a', color: '#ffffff' },
  playing: { bg: '#dc2626', color: '#ffffff' },
  prompt: { bg: '#1a1a1a', color: '#ffffff' },
  response: { bg: '#ffffff', color: '#1a1a1a' },
};

export default function NewGamePage() {
  const router = useRouter();
  const addToast = useToastStore((state) => state.addToast);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [gameName, setGameName] = useState('');
  const [gameDescription, setGameDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/game-kit/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setGameName('');
    setGameDescription('');
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !gameName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/game-kit/definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gameName.trim(),
          description: gameDescription.trim() || null,
          templateId: selectedTemplate.id,
        }),
      });

      if (res.ok) {
        const game = await res.json();
        router.push(`/game-kit/edit/${game.id}`);
      } else {
        const errorData = await res.json();
        addToast({ message: getErrorMessage(errorData, ERROR_MESSAGES.GAME_CREATE_FAILED), type: 'error' });
      }
    } catch (error) {
      console.error('Failed to create game:', error);
      addToast({ message: ERROR_MESSAGES.GAME_CREATE_FAILED, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.title}>Create New Game</h1>
            <p style={styles.subtitle}>Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="gk-container">
      <style jsx global>{gameKitResponsiveCSS}</style>
      <div style={styles.content}>
        <Link href="/game-kit" style={styles.backButton}>
          <ArrowLeft size={20} />
          Back to My Games
        </Link>

        <div style={styles.header}>
          <h1 style={styles.title}>Choose a Template</h1>
          <p style={styles.subtitle}>Pick a game type to get started</p>
        </div>

        <div style={styles.templateGrid} className="gk-template-grid">
          {/* Blank Canvas - Visual Builder */}
          <div
            style={{
              ...styles.templateCard,
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(255, 130, 0, 0.2) 100%)',
              borderColor: 'rgba(139, 92, 246, 0.4)',
            }}
            onClick={() => router.push('/game-kit/builder')}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7D55C7';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(139, 92, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ ...styles.templateIcon, display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <Wand2 size={40} style={{ color: '#7D55C7' }} />
              <Sparkles size={40} style={{ color: '#FF8200' }} />
            </div>
            <div style={{ ...styles.templateName, color: '#c4b5fd' }}>Blank Canvas</div>
            <div style={styles.templateDescription}>
              Build any card game from scratch using our visual block editor. Full creative control!
            </div>
            <div style={styles.templateCardTypes}>
              <span style={{ ...styles.cardTypeBadge, background: 'linear-gradient(135deg, #7D55C7 0%, #FF8200 100%)', color: '#ffffff' }}>
                Advanced
              </span>
            </div>
          </div>

          {templates.map((template) => (
            <div
              key={template.id}
              style={styles.templateCard}
              onClick={() => handleTemplateSelect(template)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF8200';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(255, 130, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 130, 0, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={styles.templateIcon}>{template.iconEmoji || '🎴'}</div>
              <div style={styles.templateName}>{template.name}</div>
              <div style={styles.templateDescription}>{template.description}</div>
              <div style={styles.templateCardTypes}>
                {template.cardTypes.map((type) => (
                  <span
                    key={type}
                    style={{
                      ...styles.cardTypeBadge,
                      background: cardTypeColors[type]?.bg || '#475569',
                      color: cardTypeColors[type]?.color || '#ffffff',
                    }}
                  >
                    {type} cards
                  </span>
                ))}
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Creation Modal */}
      {selectedTemplate && (
        <div style={styles.modal} onClick={() => setSelectedTemplate(null)}>
          <div style={styles.modalContent} className="gk-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...styles.sectionTitle, marginBottom: '24px' }}>
              {selectedTemplate.iconEmoji} Create {selectedTemplate.name} Game
            </h2>

            <div style={styles.formGroup}>
              <label style={styles.label}>Game Name *</label>
              <input
                type="text"
                style={styles.input}
                placeholder="My Awesome Game"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                autoFocus
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description (optional)</label>
              <textarea
                style={styles.textarea}
                placeholder="A hilarious party game for horrible people..."
                value={gameDescription}
                onChange={(e) => setGameDescription(e.target.value)}
              />
            </div>

            <div style={styles.buttonRow} className="gk-button-row">
              <button
                style={styles.cancelButton}
                onClick={() => setSelectedTemplate(null)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                style={{
                  ...adminStyles.button,
                  padding: '12px 24px',
                  opacity: !gameName.trim() || creating ? 0.5 : 1,
                  cursor: !gameName.trim() || creating ? 'not-allowed' : 'pointer',
                }}
                onClick={handleCreate}
                disabled={!gameName.trim() || creating}
              >
                {creating ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                    Creating...
                  </>
                ) : (
                  'Create Game'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
