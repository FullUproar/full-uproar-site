'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Save, Play, Trash2, Plus, Upload, Copy, Check,
  GripVertical, Sparkles, AlertCircle, Loader2
} from 'lucide-react';
import { adminStyles } from '@/app/admin/styles/adminStyles';
import { gameKitResponsiveCSS } from '@/lib/game-kit/responsive-styles';

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// CSS ANIMATIONS
// =============================================================================

const animationStyles = `
@keyframes cardAppear {
  0% { opacity: 0; transform: translateY(-20px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes cardRemove {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.8) translateY(-10px); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
@keyframes saveSuccess {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
.card-appear {
  animation: cardAppear 0.3s ease-out forwards;
}
.card-editing {
  transform: scale(1.02);
  box-shadow: 0 8px 40px rgba(249, 115, 22, 0.4) !important;
}
.drag-over {
  border-color: #f97316 !important;
  background: rgba(249, 115, 22, 0.1) !important;
}
.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}
`;

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    padding: '20px',
  },
  content: {
    maxWidth: '1600px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#fdba74',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '14px',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    marginBottom: '20px',
    fontSize: '14px',
    transition: 'color 0.2s',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '32px',
  },
  mainPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(30, 41, 59, 0.4)',
    padding: '8px',
    borderRadius: '16px',
  },
  tab: {
    flex: 1,
    padding: '14px 20px',
    background: 'transparent',
    border: 'none',
    borderRadius: '12px',
    color: '#94a3b8',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
  },
  tabCount: {
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    minHeight: '400px',
  },
  cardWrapper: {
    position: 'relative' as const,
  },
  playingCard: {
    position: 'relative' as const,
    borderRadius: '16px',
    padding: '24px',
    minHeight: '200px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  },
  blackCard: {
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
    border: '2px solid #333',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    color: '#ffffff',
  },
  whiteCard: {
    background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
    border: '2px solid #e0e0e0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    color: '#1a1a1a',
  },
  cardText: {
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '1.4',
    flex: 1,
    wordBreak: 'break-word' as const,
  },
  cardTextarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '18px',
    fontWeight: '700',
    lineHeight: '1.4',
    resize: 'none' as const,
    color: 'inherit',
    fontFamily: 'inherit',
    flex: 1,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(128, 128, 128, 0.2)',
  },
  cardBrand: {
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    opacity: 0.6,
  },
  pickBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  blackPickBadge: {
    background: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
  },
  cardActions: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    display: 'flex',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  cardActionBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  dragHandle: {
    position: 'absolute' as const,
    top: '8px',
    left: '8px',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    cursor: 'grab',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  addCardButton: {
    borderRadius: '16px',
    padding: '24px',
    minHeight: '200px',
    border: '3px dashed',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  addCardBlack: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  addCardWhite: {
    borderColor: 'rgba(0, 0, 0, 0.15)',
    color: 'rgba(0, 0, 0, 0.4)',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    position: 'sticky' as const,
    top: '20px',
  },
  sidebarCard: {
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(10px)',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    color: '#fdba74',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: '16px',
  },
  progressBar: {
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  importArea: {
    width: '100%',
    padding: '16px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '2px dashed rgba(249, 115, 22, 0.3)',
    borderRadius: '12px',
    color: '#e2e8f0',
    fontSize: '14px',
    minHeight: '140px',
    resize: 'vertical' as const,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  previewSection: {
    textAlign: 'center' as const,
  },
  livePreviewCard: {
    transform: 'scale(0.85)',
    transformOrigin: 'top center',
    margin: '0 auto',
  },
  saveIndicator: {
    position: 'fixed' as const,
    bottom: '24px',
    right: '24px',
    padding: '16px 28px',
    borderRadius: '50px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    zIndex: 100,
    transition: 'all 0.3s ease',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#94a3b8',
    marginBottom: '12px',
  },
  emptyDescription: {
    fontSize: '16px',
    maxWidth: '400px',
    margin: '0 auto 24px',
    lineHeight: '1.6',
  },
  blankHighlight: {
    background: 'linear-gradient(90deg, #f97316, #ea580c)',
    padding: '2px 8px',
    borderRadius: '4px',
    margin: '0 2px',
  },
};

// =============================================================================
// HELPER: Render card text with blank highlighting
// =============================================================================

function renderCardText(text: string, isBlack: boolean): React.ReactNode {
  if (!isBlack || !text.includes('_')) {
    return text || 'Enter your card text...';
  }

  // Split by underscore sequences and render blanks as highlighted
  const parts = text.split(/(_+)/g);
  return parts.map((part, i) => {
    if (/^_+$/.test(part)) {
      return (
        <span key={i} style={styles.blankHighlight}>
          {'\u00A0'.repeat(Math.max(part.length * 2, 6))}
        </span>
      );
    }
    return part;
  });
}

// =============================================================================
// PLAYING CARD COMPONENT
// =============================================================================

interface PlayingCardProps {
  card: Card;
  isBlack: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onUpdate: (field: string, value: string | number) => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, cardId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  placeholder?: string;
}

function PlayingCard({
  card,
  isBlack,
  isEditing,
  onEdit,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  placeholder,
}: PlayingCardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      adjustHeight();
    }
  }, [isEditing]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(textareaRef.current.scrollHeight, 80) + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      (e.target as HTMLTextAreaElement).blur();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      // Find next card and focus it
      const cards = document.querySelectorAll('[data-card-id]');
      const currentIndex = Array.from(cards).findIndex(
        el => el.getAttribute('data-card-id') === card.id
      );
      const nextCard = cards[e.shiftKey ? currentIndex - 1 : currentIndex + 1];
      if (nextCard) {
        (nextCard as HTMLElement).click();
      }
    }
  };

  return (
    <div
      data-card-id={card.id}
      draggable={!isEditing}
      onDragStart={(e) => {
        setIsDragging(true);
        onDragStart(e, card.id);
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver(e);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, card.id);
      }}
      style={styles.cardWrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`card-appear ${isEditing ? 'card-editing' : ''} ${isDragOver ? 'drag-over' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          ...styles.playingCard,
          ...(isBlack ? styles.blackCard : styles.whiteCard),
        }}
        onClick={!isEditing ? onEdit : undefined}
      >
        {/* Drag Handle */}
        <div
          style={{
            ...styles.dragHandle,
            opacity: isHovered && !isEditing ? 0.6 : 0,
            background: isBlack ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            color: isBlack ? '#888' : '#999',
          }}
        >
          <GripVertical size={14} />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            ...styles.cardActions,
            opacity: isHovered ? 1 : 0,
          }}
        >
          <button
            style={{
              ...styles.cardActionBtn,
              background: isBlack ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete card"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Card Content */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            style={{
              ...styles.cardTextarea,
              color: isBlack ? '#ffffff' : '#1a1a1a',
            }}
            value={card.properties.text}
            onChange={(e) => {
              onUpdate('text', e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => onEdit()}
            placeholder={placeholder}
          />
        ) : (
          <div style={styles.cardText}>
            {card.properties.text ? (
              renderCardText(card.properties.text, isBlack)
            ) : (
              <span style={{ opacity: 0.4 }}>{placeholder || 'Click to edit...'}</span>
            )}
          </div>
        )}

        {/* Card Footer */}
        <div style={styles.cardFooter}>
          <span style={styles.cardBrand}>
            {isBlack ? '🃏 Full Uproar' : 'Full Uproar'}
          </span>
          {isBlack && card.properties.pick && card.properties.pick > 1 && (
            <span style={{ ...styles.pickBadge, ...styles.blackPickBadge }}>
              PICK {card.properties.pick}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ADD CARD BUTTON
// =============================================================================

interface AddCardButtonProps {
  isBlack: boolean;
  onClick: () => void;
}

function AddCardButton({ isBlack, onClick }: AddCardButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      style={{
        ...styles.addCardButton,
        ...(isBlack ? styles.addCardBlack : styles.addCardWhite),
        borderColor: isHovered
          ? (isBlack ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)')
          : undefined,
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Plus size={32} />
      <span style={{ fontWeight: '600', fontSize: '15px' }}>Add Card</span>
    </button>
  );
}

// =============================================================================
// MAIN EDITOR COMPONENT
// =============================================================================

export default function GameEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // State
  const [game, setGame] = useState<GameDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<string>('black');
  const [cards, setCards] = useState<Card[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const originalCardsRef = useRef<Card[]>([]);

  // Fetch game data
  useEffect(() => {
    fetchGame();
  }, [id]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasChanges || !game) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCards();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [cards, hasChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) saveCards();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges]);

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/game-kit/definitions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setGame(data);
        const corePack = data.cardPacks.find((p: CardPack) => p.isCore);
        if (corePack) {
          setCards(corePack.cards);
          originalCardsRef.current = corePack.cards;
        }
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
    setSaveStatus('saving');

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
          deleteIds: originalCardsRef.current
            .filter(c => !cards.find(card => card.id === c.id))
            .map(c => c.id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCards(data.pack.cards);
        originalCardsRef.current = data.pack.cards;
        setHasChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save cards:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }, [game, cards]);

  const updateCard = (cardId: string, field: string, value: string | number) => {
    setCards(prev => prev.map(c => {
      if (c.id !== cardId) return c;
      if (field === 'text') {
        const text = value as string;
        const blankCount = (text.match(/_+/g) || []).reduce((sum, match) => sum + 1, 0);
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
    // Auto-focus the new card
    setTimeout(() => setEditingCardId(newCard.id), 100);
  };

  const deleteCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setHasChanges(true);
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetId) return;

    setCards(prev => {
      const newCards = [...prev];
      const draggedIndex = newCards.findIndex(c => c.id === draggedCardId);
      const targetIndex = newCards.findIndex(c => c.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const [removed] = newCards.splice(draggedIndex, 1);
      newCards.splice(targetIndex, 0, removed);

      return newCards;
    });
    setDraggedCardId(null);
    setHasChanges(true);
  };

  const importCards = (cardType: string) => {
    if (!importText.trim()) return;

    const lines = importText.split('\n').filter(line => line.trim());
    const newCards: Card[] = lines.map((text, idx) => {
      const blankCount = (text.match(/_+/g) || []).reduce((sum) => sum + 1, 0);
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

  // Loading state
  if (loading || !game) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={48} style={{ color: '#fdba74', animation: 'spin 1s linear infinite' }} />
        <style>{animationStyles}</style>
      </div>
    );
  }

  const editorHints = game.template.editorHints;
  const currentTypeCards = cards.filter(c => c.cardType === activeTab);
  const currentTypeHint = editorHints?.cardTypes.find(t => t.id === activeTab);
  const isBlack = activeTab === 'black';

  const minCards = editorHints?.minCards?.[activeTab] || 0;
  const recommendedCards = editorHints?.recommendedCards?.[activeTab] || 0;
  const progress = recommendedCards > 0 ? Math.min((currentTypeCards.length / recommendedCards) * 100, 100) : 0;

  return (
    <div style={styles.container} className="gk-container">
      <style>{animationStyles}</style>
      <style jsx global>{gameKitResponsiveCSS}</style>

      <div style={styles.content}>
        {/* Back Button */}
        <Link
          href="/game-kit"
          style={styles.backButton}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fdba74'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
        >
          <ArrowLeft size={18} />
          Back to Games
        </Link>

        {/* Header */}
        <div style={styles.header} className="gk-header">
          <div style={styles.headerLeft}>
            <h1 style={styles.title} className="gk-title">
              <span style={{ fontSize: '36px' }}>{game.template.iconEmoji}</span>
              {game.name}
            </h1>
            <p style={styles.subtitle}>
              {game.description || `Create your own ${game.template.name} cards`}
            </p>
          </div>
          <div style={styles.headerRight} className="gk-header-actions">
            <button
              style={{
                ...adminStyles.button,
                background: 'transparent',
                border: '2px solid rgba(249, 115, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={copyShareLink}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Share Link'}
            </button>
            <Link href={`/game-kit/play/${game.shareToken}`} style={{ textDecoration: 'none' }}>
              <button
                style={{
                  ...adminStyles.button,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Play size={16} />
                Play Now
              </button>
            </Link>
          </div>
        </div>

        {/* Main Layout */}
        <div style={styles.layout}>
          {/* Main Panel */}
          <div style={styles.mainPanel}>
            {/* Tab Bar */}
            <div style={styles.tabBar}>
              {game.template.cardTypes.map(type => {
                const typeHint = editorHints?.cardTypes.find(t => t.id === type);
                const count = cards.filter(c => c.cardType === type).length;
                const isActive = activeTab === type;
                const min = editorHints?.minCards?.[type] || 0;

                return (
                  <button
                    key={type}
                    style={{
                      ...styles.tab,
                      ...(isActive ? styles.tabActive : {}),
                    }}
                    onClick={() => setActiveTab(type)}
                  >
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: type === 'black' ? '#1a1a1a' : '#ffffff',
                      border: type === 'black' ? '2px solid #333' : '2px solid #ccc',
                    }} />
                    {typeHint?.name || type}
                    <span style={{
                      ...styles.tabCount,
                      background: isActive
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(249, 115, 22, 0.2)',
                      color: isActive ? '#ffffff' : (count < min ? '#ef4444' : '#fdba74'),
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cards Grid */}
            <div style={styles.cardsGrid}>
              {currentTypeCards.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>{isBlack ? '🃏' : '📄'}</div>
                  <h3 style={styles.emptyTitle}>No {currentTypeHint?.name || activeTab} cards yet</h3>
                  <p style={styles.emptyDescription}>
                    {isBlack
                      ? 'Add prompt cards with blanks using underscores (_) for players to fill in.'
                      : 'Add response cards that players will use to complete the prompts.'}
                  </p>
                  <button
                    style={{
                      ...adminStyles.button,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onClick={() => addCard(activeTab)}
                  >
                    <Sparkles size={16} />
                    Create Your First Card
                  </button>
                </div>
              ) : (
                <>
                  {currentTypeCards.map(card => (
                    <PlayingCard
                      key={card.id}
                      card={card}
                      isBlack={isBlack}
                      isEditing={editingCardId === card.id}
                      onEdit={() => setEditingCardId(editingCardId === card.id ? null : card.id)}
                      onUpdate={(field, value) => updateCard(card.id, field, value)}
                      onDelete={() => deleteCard(card.id)}
                      onDragStart={handleDragStart}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      placeholder={currentTypeHint?.fields[0]?.placeholder}
                    />
                  ))}
                  <AddCardButton isBlack={isBlack} onClick={() => addCard(activeTab)} />
                </>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={styles.sidebar}>
            {/* Stats Card */}
            <div style={styles.sidebarCard}>
              <div style={styles.sectionTitle}>
                <Sparkles size={14} />
                Progress
              </div>

              {game.template.cardTypes.map(type => {
                const count = cards.filter(c => c.cardType === type).length;
                const min = editorHints?.minCards?.[type] || 0;
                const rec = editorHints?.recommendedCards?.[type] || 0;
                const typeHint = editorHints?.cardTypes.find(t => t.id === type);
                const prog = rec > 0 ? Math.min((count / rec) * 100, 100) : (count > 0 ? 100 : 0);
                const isGood = count >= min;

                return (
                  <div key={type}>
                    <div style={styles.statRow}>
                      <span style={styles.statLabel}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: type === 'black' ? '#1a1a1a' : '#ffffff',
                          border: type === 'black' ? '1px solid #333' : '1px solid #ccc',
                        }} />
                        {typeHint?.name || type}
                      </span>
                      <span style={{
                        ...styles.statValue,
                        color: isGood ? '#4ade80' : '#ef4444',
                      }}>
                        {count}{min > 0 && ` / ${min}`}
                      </span>
                    </div>
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${prog}%`,
                        background: isGood
                          ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                          : 'linear-gradient(90deg, #f97316, #ea580c)',
                      }} />
                    </div>
                  </div>
                );
              })}

              <div style={{ ...styles.statRow, borderBottom: 'none', marginTop: '12px' }}>
                <span style={{ ...styles.statLabel, fontWeight: 'bold' }}>Total Cards</span>
                <span style={{ ...styles.statValue, color: '#fdba74' }}>{cards.length}</span>
              </div>
            </div>

            {/* Quick Import */}
            <div style={styles.sidebarCard}>
              <div style={styles.sectionTitle}>
                <Upload size={14} />
                Quick Import
              </div>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>
                Paste {currentTypeHint?.name?.toLowerCase() || activeTab} cards below, one per line.
                {isBlack && ' Use underscores (_) for blanks.'}
              </p>
              <textarea
                style={styles.importArea}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={isBlack
                  ? "What's that smell?\n_ is never a good look.\nI can't believe they made _ into a movie."
                  : "A disappointing birthday party.\nMy browser history.\nAggressive hand gestures."}
                onFocus={(e) => e.target.style.borderColor = 'rgba(249, 115, 22, 0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(249, 115, 22, 0.3)'}
              />
              {importText.trim() && (
                <button
                  style={{
                    ...adminStyles.button,
                    marginTop: '12px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  onClick={() => importCards(activeTab)}
                >
                  <Plus size={16} />
                  Import {importText.split('\n').filter(l => l.trim()).length} Cards
                </button>
              )}
            </div>

            {/* Tips */}
            <div style={{ ...styles.sidebarCard, background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <div style={{ ...styles.sectionTitle, color: '#60a5fa' }}>
                <AlertCircle size={14} />
                Tips
              </div>
              <ul style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.8', paddingLeft: '16px', margin: 0 }}>
                <li>Click any card to edit it</li>
                <li>Drag cards to reorder them</li>
                <li>Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Tab</kbd> to move between cards</li>
                <li>Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Ctrl+S</kbd> to save</li>
                <li>Changes auto-save after 2 seconds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div style={{
          ...styles.saveIndicator,
          background: saveStatus === 'saved'
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : saveStatus === 'error'
            ? 'linear-gradient(135deg, #ef4444, #dc2626)'
            : 'linear-gradient(135deg, #f97316, #ea580c)',
        }}>
          {saveStatus === 'saving' && <Loader2 size={18} style={{ animation: 'pulse 1s infinite' }} />}
          {saveStatus === 'saved' && <Check size={18} />}
          {saveStatus === 'error' && <AlertCircle size={18} />}
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save failed'}
        </div>
      )}

      {/* Unsaved Changes Indicator */}
      {hasChanges && saveStatus === 'idle' && (
        <div style={{
          ...styles.saveIndicator,
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(249, 115, 22, 0.4)',
          cursor: 'pointer',
        }}
        onClick={saveCards}
        >
          <Save size={18} />
          Unsaved changes - click to save
        </div>
      )}
    </div>
  );
}
