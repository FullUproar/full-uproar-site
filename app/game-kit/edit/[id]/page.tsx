'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Play, Trash2, Plus, Upload, Copy, Check } from 'lucide-react';
import { adminStyles } from '@/app/admin/styles/adminStyles';

interface Card {
  id: string;
  cardType: string;
  properties: {
    text: string;
    pick?: number;
  };
  sortOrder: number;
}

interface CardPack {
  id: string;
  name: string;
  isCore: boolean;
  cards: Card[];
}

interface EditorHints {
  cardTypes: {
    id: string;
    name: string;
    description: string;
    color: string;
    textColor: string;
    fields: {
      name: string;
      type: string;
      label: string;
      placeholder?: string;
      default?: number;
      min?: number;
      max?: number;
      auto?: boolean;
      autoFrom?: string;
    }[];
  }[];
  minCards?: Record<string, number>;
  recommendedCards?: Record<string, number>;
}

interface GameDefinition {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  shareToken: string;
  minPlayers: number;
  maxPlayers: number;
  template: {
    name: string;
    iconEmoji: string | null;
    cardTypes: string[];
    editorHints: EditorHints | null;
  };
  cardPacks: CardPack[];
}

const styles = {
  ...adminStyles,
  editorLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '24px',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    borderBottom: '2px solid rgba(249, 115, 22, 0.2)',
    paddingBottom: '12px',
  },
  tab: {
    padding: '10px 20px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: 'rgba(249, 115, 22, 0.2)',
    color: '#fdba74',
  },
  cardTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  cardRow: {
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
  },
  cardCell: {
    padding: '8px',
    verticalAlign: 'top' as const,
  },
  cardInput: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    resize: 'none' as const,
    minHeight: '40px',
  },
  pickInput: {
    width: '60px',
    padding: '10px 12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '14px',
    textAlign: 'center' as const,
    outline: 'none',
  },
  deleteBtn: {
    padding: '8px',
    background: 'transparent',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    opacity: 0.5,
    transition: 'opacity 0.2s',
  },
  addCardRow: {
    padding: '12px',
    textAlign: 'center' as const,
  },
  addCardBtn: {
    padding: '8px 16px',
    background: 'rgba(249, 115, 22, 0.1)',
    border: '2px dashed rgba(249, 115, 22, 0.3)',
    borderRadius: '8px',
    color: '#fdba74',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  sidebarCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '12px',
    padding: '20px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#94a3b8',
    fontSize: '14px',
    marginBottom: '8px',
  },
  importArea: {
    width: '100%',
    padding: '12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px dashed rgba(249, 115, 22, 0.3)',
    borderRadius: '8px',
    color: '#94a3b8',
    fontSize: '14px',
    minHeight: '120px',
    resize: 'vertical' as const,
    outline: 'none',
  },
  previewCard: {
    padding: '20px',
    borderRadius: '12px',
    minHeight: '150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    fontSize: '16px',
    lineHeight: '1.4',
  },
};

export default function GameEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<GameDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('black');
  const [cards, setCards] = useState<Card[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/game-kit/definitions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data);
        // Get cards from the core pack
        const corePack = data.cardPacks.find((p: CardPack) => p.isCore);
        if (corePack) {
          setCards(corePack.cards);
        }
        // Set initial tab to first card type
        if (data.template.cardTypes.length > 0) {
          setActiveTab(data.template.cardTypes[0]);
        }
      } else {
        router.push('/game-kit');
      }
    } catch (error) {
      console.error('Failed to fetch game:', error);
      router.push('/game-kit');
    } finally {
      setLoading(false);
    }
  };

  const saveCards = useCallback(async () => {
    if (!game) return;

    const corePack = game.cardPacks.find(p => p.isCore);
    if (!corePack) return;

    setSaving(true);
    try {
      const res = await fetch('/api/game-kit/cards/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: corePack.id,
          cards: cards.map((c, idx) => ({
            id: c.id.startsWith('new-') ? undefined : c.id,
            cardType: c.cardType,
            properties: c.properties,
            sortOrder: idx,
          })),
          deleteIds: corePack.cards
            .filter(c => !cards.find(card => card.id === c.id))
            .map(c => c.id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCards(data.pack.cards);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save cards:', error);
    } finally {
      setSaving(false);
    }
  }, [game, cards]);

  const updateCard = (cardId: string, field: string, value: string | number) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      if (field === 'text') {
        // Auto-calculate pick from blanks for black cards
        const text = value as string;
        const blankCount = (text.match(/_/g) || []).length;
        return {
          ...c,
          properties: {
            ...c.properties,
            text,
            ...(c.cardType === 'black' ? { pick: blankCount > 0 ? blankCount : 1 } : {}),
          },
        };
      }
      if (field === 'pick') {
        return {
          ...c,
          properties: { ...c.properties, pick: value as number },
        };
      }
      return c;
    }));
    setHasChanges(true);
  };

  const addCard = (cardType: string) => {
    const newCard: Card = {
      id: `new-${Date.now()}`,
      cardType,
      properties: { text: '', pick: cardType === 'black' ? 1 : undefined },
      sortOrder: cards.filter(c => c.cardType === cardType).length,
    };
    setCards(prev => [...prev, newCard]);
    setHasChanges(true);
  };

  const deleteCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setHasChanges(true);
  };

  const importCards = (cardType: string) => {
    if (!importText.trim()) return;

    const lines = importText.split('\n').filter(line => line.trim());
    const newCards: Card[] = lines.map((text, idx) => {
      const blankCount = (text.match(/_/g) || []).length;
      return {
        id: `new-${Date.now()}-${idx}`,
        cardType,
        properties: {
          text: text.trim(),
          ...(cardType === 'black' ? { pick: blankCount > 0 ? blankCount : 1 } : {}),
        },
        sortOrder: cards.filter(c => c.cardType === cardType).length + idx,
      };
    });

    setCards(prev => [...prev, ...newCards]);
    setImportText('');
    setHasChanges(true);
  };

  const copyShareLink = async () => {
    if (!game) return;
    const url = `${window.location.origin}/game-kit/play/${game.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !game) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.header}>
            <h1 style={styles.title}>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  const editorHints = game.template.editorHints;
  const currentTypeCards = cards.filter(c => c.cardType === activeTab);
  const currentTypeHint = editorHints?.cardTypes.find(t => t.id === activeTab);

  return (
    <div style={styles.container}>
      <div style={{ ...styles.content, maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link href="/game-kit" style={styles.backButton}>
            <ArrowLeft size={20} />
            Back
          </Link>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{
                ...adminStyles.button,
                background: 'transparent',
                border: '2px solid rgba(249, 115, 22, 0.3)',
              }}
              onClick={copyShareLink}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <Link href={`/game-kit/play/${game.shareToken}`} style={{ textDecoration: 'none' }}>
              <button style={adminStyles.button}>
                <Play size={16} style={{ marginRight: '8px' }} />
                Play
              </button>
            </Link>
          </div>
        </div>

        <div style={styles.header}>
          <h1 style={styles.title}>
            {game.template.iconEmoji} {game.name}
          </h1>
          <p style={styles.subtitle}>{game.description || `Based on ${game.template.name}`}</p>
        </div>

        <div style={styles.editorLayout}>
          {/* Main Editor Area */}
          <div>
            {/* Tab Bar */}
            <div style={styles.tabBar}>
              {game.template.cardTypes.map(type => {
                const typeHint = editorHints?.cardTypes.find(t => t.id === type);
                const count = cards.filter(c => c.cardType === type).length;
                return (
                  <button
                    key={type}
                    style={{
                      ...styles.tab,
                      ...(activeTab === type ? styles.tabActive : {}),
                    }}
                    onClick={() => setActiveTab(type)}
                  >
                    {typeHint?.name || type} ({count})
                  </button>
                );
              })}
            </div>

            {/* Card Table */}
            <div style={styles.section}>
              <table style={styles.cardTable}>
                <thead>
                  <tr>
                    <th style={{ ...adminStyles.tableHeaderCell, width: '40px' }}>#</th>
                    <th style={adminStyles.tableHeaderCell}>Card Text</th>
                    {activeTab === 'black' && (
                      <th style={{ ...adminStyles.tableHeaderCell, width: '80px' }}>Pick</th>
                    )}
                    <th style={{ ...adminStyles.tableHeaderCell, width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {currentTypeCards.map((card, idx) => (
                    <tr key={card.id} style={styles.cardRow}>
                      <td style={{ ...styles.cardCell, color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={styles.cardCell}>
                        <textarea
                          style={styles.cardInput}
                          value={card.properties.text}
                          onChange={(e) => updateCard(card.id, 'text', e.target.value)}
                          placeholder={currentTypeHint?.fields[0]?.placeholder || 'Enter card text...'}
                          rows={1}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                          }}
                        />
                      </td>
                      {activeTab === 'black' && (
                        <td style={styles.cardCell}>
                          <input
                            type="number"
                            style={styles.pickInput}
                            value={card.properties.pick || 1}
                            onChange={(e) => updateCard(card.id, 'pick', parseInt(e.target.value) || 1)}
                            min={1}
                            max={3}
                          />
                        </td>
                      )}
                      <td style={styles.cardCell}>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => deleteCard(card.id)}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={styles.addCardRow}>
                <button style={styles.addCardBtn} onClick={() => addCard(activeTab)}>
                  <Plus size={16} />
                  Add Card
                </button>
              </div>
            </div>

            {/* Save Button */}
            {hasChanges && (
              <div style={{ position: 'sticky', bottom: '20px', textAlign: 'right' }}>
                <button
                  style={{
                    ...adminStyles.button,
                    padding: '12px 32px',
                    fontSize: '16px',
                    boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)',
                  }}
                  onClick={saveCards}
                  disabled={saving}
                >
                  <Save size={18} style={{ marginRight: '8px' }} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={styles.sidebar}>
            {/* Stats */}
            <div style={styles.sidebarCard}>
              <h3 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>Stats</h3>
              {game.template.cardTypes.map(type => {
                const count = cards.filter(c => c.cardType === type).length;
                const min = editorHints?.minCards?.[type] || 0;
                const recommended = editorHints?.recommendedCards?.[type] || 0;
                const typeHint = editorHints?.cardTypes.find(t => t.id === type);
                return (
                  <div key={type} style={styles.statRow}>
                    <span>{typeHint?.name || type}</span>
                    <span style={{ color: count < min ? '#ef4444' : '#4ade80' }}>
                      {count} {min > 0 && `/ ${min} min`}
                    </span>
                  </div>
                );
              })}
              <div style={{ ...styles.statRow, marginTop: '12px', borderTop: '1px solid rgba(249, 115, 22, 0.2)', paddingTop: '12px' }}>
                <span>Total</span>
                <span style={{ color: '#fdba74' }}>{cards.length} cards</span>
              </div>
            </div>

            {/* Quick Import */}
            <div style={styles.sidebarCard}>
              <h3 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>
                <Upload size={16} style={{ marginRight: '8px' }} />
                Quick Import
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>
                Paste cards (one per line) to add to {currentTypeHint?.name || activeTab}:
              </p>
              <textarea
                style={styles.importArea}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste cards here...&#10;One card per line&#10;Use _ for blanks"
              />
              {importText.trim() && (
                <button
                  style={{ ...adminStyles.button, marginTop: '12px', width: '100%' }}
                  onClick={() => importCards(activeTab)}
                >
                  Import {importText.split('\n').filter(l => l.trim()).length} Cards
                </button>
              )}
            </div>

            {/* Card Preview */}
            {currentTypeCards.length > 0 && (
              <div style={styles.sidebarCard}>
                <h3 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>Preview</h3>
                <div
                  style={{
                    ...styles.previewCard,
                    background: currentTypeHint?.color || (activeTab === 'black' ? '#1a1a1a' : '#ffffff'),
                    color: currentTypeHint?.textColor || (activeTab === 'black' ? '#ffffff' : '#1a1a1a'),
                  }}
                >
                  {currentTypeCards[currentTypeCards.length - 1]?.properties.text || 'Your card text here...'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
