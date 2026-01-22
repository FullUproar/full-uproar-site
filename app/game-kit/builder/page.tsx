'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Play, Save, Plus, Trash2, ChevronRight, ChevronDown,
  Copy, Settings, Zap, RotateCcw, Users, Layers, Target, Clock,
  Shuffle, Eye, EyeOff, ArrowRightLeft, MessageSquare, Award,
  GitBranch, Repeat, Filter, Box, Sparkles, GripVertical,
  HelpCircle, Code, Palette, Loader2, Check
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type BlockKind = 'game' | 'round' | 'turn' | 'phase' | 'action' | 'condition' | 'trigger';

interface Block {
  id: string;
  kind: BlockKind;
  type: string;
  name: string;
  description?: string;
  children?: Block[];
  properties?: Record<string, any>;
  collapsed?: boolean;
}

interface BlockTemplate {
  type: string;
  kind: BlockKind;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  defaultProperties?: Record<string, any>;
  canHaveChildren?: boolean;
  category: string;
}

// =============================================================================
// BLOCK TEMPLATES
// =============================================================================

const blockTemplates: BlockTemplate[] = [
  // SCOPES
  {
    type: 'round',
    kind: 'round',
    name: 'Round',
    icon: <Repeat size={16} />,
    color: '#8b5cf6',
    description: 'A repeating round of play',
    canHaveChildren: true,
    category: 'Structure',
    defaultProperties: { iterate: 'until', maxIterations: 100 },
  },
  {
    type: 'turn',
    kind: 'turn',
    name: 'Player Turn',
    icon: <Users size={16} />,
    color: '#06b6d4',
    description: 'Each player takes a turn',
    canHaveChildren: true,
    category: 'Structure',
    defaultProperties: { iterate: 'forEachPlayer', order: 'turnOrder' },
  },
  {
    type: 'phase',
    kind: 'phase',
    name: 'Phase',
    icon: <Layers size={16} />,
    color: '#10b981',
    description: 'A distinct phase within a turn',
    canHaveChildren: true,
    category: 'Structure',
    defaultProperties: { iterate: 'once' },
  },

  // CARD ACTIONS
  {
    type: 'draw',
    kind: 'action',
    name: 'Draw Cards',
    icon: <Plus size={16} />,
    color: '#f97316',
    description: 'Draw cards from a deck',
    category: 'Cards',
    defaultProperties: { count: 1, from: 'deck', to: 'hand' },
  },
  {
    type: 'play',
    kind: 'action',
    name: 'Play Card',
    icon: <ArrowRightLeft size={16} />,
    color: '#f97316',
    description: 'Play a card to the table',
    category: 'Cards',
    defaultProperties: { from: 'hand', to: 'table' },
  },
  {
    type: 'discard',
    kind: 'action',
    name: 'Discard',
    icon: <Trash2 size={16} />,
    color: '#f97316',
    description: 'Discard cards',
    category: 'Cards',
    defaultProperties: { to: 'discard' },
  },
  {
    type: 'shuffle',
    kind: 'action',
    name: 'Shuffle',
    icon: <Shuffle size={16} />,
    color: '#f97316',
    description: 'Shuffle a deck or zone',
    category: 'Cards',
    defaultProperties: { zone: 'deck' },
  },
  {
    type: 'reveal',
    kind: 'action',
    name: 'Reveal Cards',
    icon: <Eye size={16} />,
    color: '#f97316',
    description: 'Show cards to players',
    category: 'Cards',
    defaultProperties: { to: 'all' },
  },
  {
    type: 'hide',
    kind: 'action',
    name: 'Hide Cards',
    icon: <EyeOff size={16} />,
    color: '#f97316',
    description: 'Hide cards from view',
    category: 'Cards',
  },

  // PLAYER ACTIONS
  {
    type: 'chooseCards',
    kind: 'action',
    name: 'Choose Cards',
    icon: <Target size={16} />,
    color: '#ec4899',
    description: 'Player selects cards',
    category: 'Player',
    defaultProperties: { count: 1, from: 'hand' },
  },
  {
    type: 'prompt',
    kind: 'action',
    name: 'Prompt Choice',
    icon: <MessageSquare size={16} />,
    color: '#ec4899',
    description: 'Ask player to make a choice',
    category: 'Player',
    defaultProperties: { choices: [] },
  },
  {
    type: 'announce',
    kind: 'action',
    name: 'Announce',
    icon: <MessageSquare size={16} />,
    color: '#ec4899',
    description: 'Show a message to players',
    category: 'Player',
    defaultProperties: { to: 'all' },
  },

  // GAME FLOW
  {
    type: 'nextPlayer',
    kind: 'action',
    name: 'Next Player',
    icon: <RotateCcw size={16} />,
    color: '#6366f1',
    description: 'Advance to next player',
    category: 'Flow',
  },
  {
    type: 'skipPlayer',
    kind: 'action',
    name: 'Skip Player',
    icon: <RotateCcw size={16} />,
    color: '#6366f1',
    description: 'Skip one or more players',
    category: 'Flow',
    defaultProperties: { count: 1 },
  },
  {
    type: 'reverseTurnOrder',
    kind: 'action',
    name: 'Reverse Order',
    icon: <RotateCcw size={16} />,
    color: '#6366f1',
    description: 'Reverse turn direction',
    category: 'Flow',
  },

  // VARIABLES
  {
    type: 'setVariable',
    kind: 'action',
    name: 'Set Variable',
    icon: <Box size={16} />,
    color: '#14b8a6',
    description: 'Set a variable value',
    category: 'Data',
    defaultProperties: { name: '', value: 0 },
  },
  {
    type: 'increment',
    kind: 'action',
    name: 'Add Points',
    icon: <Award size={16} />,
    color: '#14b8a6',
    description: 'Add to a score or counter',
    category: 'Data',
    defaultProperties: { variable: 'score', by: 1 },
  },

  // CONDITIONS
  {
    type: 'if',
    kind: 'condition',
    name: 'If Condition',
    icon: <GitBranch size={16} />,
    color: '#eab308',
    description: 'Do something if condition is true',
    canHaveChildren: true,
    category: 'Logic',
    defaultProperties: { condition: '' },
  },
  {
    type: 'forEach',
    kind: 'condition',
    name: 'For Each',
    icon: <Repeat size={16} />,
    color: '#eab308',
    description: 'Repeat for each item',
    canHaveChildren: true,
    category: 'Logic',
    defaultProperties: { collection: 'players' },
  },

  // TRIGGERS
  {
    type: 'onEvent',
    kind: 'trigger',
    name: 'When Event',
    icon: <Zap size={16} />,
    color: '#ef4444',
    description: 'React to game events',
    canHaveChildren: true,
    category: 'Triggers',
    defaultProperties: { event: '' },
  },
  {
    type: 'winCondition',
    kind: 'trigger',
    name: 'Win Condition',
    icon: <Award size={16} />,
    color: '#ef4444',
    description: 'Define how to win',
    category: 'Triggers',
    defaultProperties: { condition: '' },
  },
];

// Group templates by category
const templatesByCategory = blockTemplates.reduce((acc, template) => {
  if (!acc[template.category]) acc[template.category] = [];
  acc[template.category].push(template);
  return acc;
}, {} as Record<string, BlockTemplate[]>);

// =============================================================================
// STYLES
// =============================================================================

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fdba74',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: '#000',
  },
  secondaryButton: {
    background: 'rgba(249, 115, 22, 0.1)',
    color: '#fdba74',
    border: '1px solid rgba(249, 115, 22, 0.3)',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '280px',
    background: 'rgba(30, 41, 59, 0.4)',
    borderRight: '1px solid rgba(249, 115, 22, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    color: '#fdba74',
  },
  sidebarContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },
  category: {
    marginBottom: '16px',
  },
  categoryTitle: {
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#64748b',
    marginBottom: '8px',
    padding: '0 4px',
  },
  templateList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  templateBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'grab',
    transition: 'all 0.2s',
    border: '1px solid transparent',
  },
  templateIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
    minWidth: 0,
  },
  templateName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '2px',
  },
  templateDesc: {
    fontSize: '11px',
    color: '#64748b',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  canvas: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  canvasInner: {
    minWidth: '600px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  propertiesPanel: {
    width: '320px',
    background: 'rgba(30, 41, 59, 0.4)',
    borderLeft: '1px solid rgba(249, 115, 22, 0.1)',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  propertiesHeader: {
    padding: '16px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fdba74',
  },
  propertiesContent: {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#64748b',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  blockWrapper: {
    position: 'relative' as const,
    marginBottom: '8px',
  },
  block: {
    borderRadius: '12px',
    border: '2px solid',
    overflow: 'hidden',
    transition: 'all 0.2s',
  },
  blockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    cursor: 'pointer',
  },
  blockIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockInfo: {
    flex: 1,
    minWidth: 0,
  },
  blockName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  blockDesc: {
    fontSize: '12px',
    opacity: 0.7,
  },
  blockActions: {
    display: 'flex',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  blockActionBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  blockChildren: {
    padding: '4px 12px 12px 24px',
    borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
  },
  dropZone: {
    border: '2px dashed rgba(249, 115, 22, 0.3)',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
    color: '#64748b',
    fontSize: '13px',
    marginTop: '8px',
    transition: 'all 0.2s',
  },
  dropZoneActive: {
    borderColor: '#f97316',
    background: 'rgba(249, 115, 22, 0.1)',
    color: '#fdba74',
  },
  gameBlock: {
    background: 'rgba(30, 41, 59, 0.8)',
    border: '2px solid rgba(249, 115, 22, 0.4)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
  },
  gameBlockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
  },
  gameBlockTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fdba74',
  },
  propertyGroup: {
    marginBottom: '20px',
  },
  propertyLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  propertyInput: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  propertySelect: {
    width: '100%',
    padding: '10px 12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
};

// =============================================================================
// BLOCK COMPONENT
// =============================================================================

interface BlockComponentProps {
  block: Block;
  depth: number;
  selected: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, template: BlockTemplate) => void;
  onDrop: (targetId: string, template: BlockTemplate) => void;
}

function BlockComponent({
  block,
  depth,
  selected,
  onSelect,
  onUpdate,
  onDelete,
  onAddChild,
  onDrop,
}: BlockComponentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const template = blockTemplates.find(t => t.type === block.type);
  const color = template?.color || '#64748b';
  const canHaveChildren = template?.canHaveChildren || block.kind !== 'action';
  const isSelected = selected === block.id;

  const handleDragOver = (e: React.DragEvent) => {
    if (!canHaveChildren) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const templateType = e.dataTransfer.getData('templateType');
    const droppedTemplate = blockTemplates.find(t => t.type === templateType);
    if (droppedTemplate) {
      onAddChild(block.id, droppedTemplate);
    }
  };

  return (
    <div style={styles.blockWrapper}>
      <div
        style={{
          ...styles.block,
          borderColor: isSelected ? color : `${color}40`,
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          boxShadow: isSelected ? `0 0 20px ${color}30` : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div
          style={{
            ...styles.blockHeader,
            background: isDragOver ? `${color}20` : 'transparent',
          }}
          onClick={() => onSelect(block.id)}
        >
          {/* Collapse toggle */}
          {canHaveChildren && (
            <button
              style={{
                ...styles.blockActionBtn,
                background: 'transparent',
                opacity: 0.6,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(block.id, { collapsed: !block.collapsed });
              }}
            >
              {block.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Icon */}
          <div style={{ ...styles.blockIcon, background: color }}>
            {template?.icon || <Box size={16} />}
          </div>

          {/* Info */}
          <div style={styles.blockInfo}>
            <div style={{ ...styles.blockName, color }}>{block.name}</div>
            {block.description && (
              <div style={styles.blockDesc}>{block.description}</div>
            )}
          </div>

          {/* Actions */}
          <div style={{ ...styles.blockActions, opacity: isHovered ? 1 : 0 }}>
            <button
              style={styles.blockActionBtn}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(block.id);
              }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Children */}
        {canHaveChildren && !block.collapsed && (
          <div style={styles.blockChildren}>
            {block.children?.map(child => (
              <BlockComponent
                key={child.id}
                block={child}
                depth={depth + 1}
                selected={selected}
                onSelect={onSelect}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onAddChild={onAddChild}
                onDrop={onDrop}
              />
            ))}

            {/* Drop zone */}
            <div
              style={{
                ...styles.dropZone,
                ...(isDragOver ? styles.dropZoneActive : {}),
              }}
            >
              <Plus size={16} style={{ marginBottom: '4px', opacity: 0.5 }} />
              <div>Drop blocks here or click to add</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PROPERTY EDITOR
// =============================================================================

interface PropertyEditorProps {
  block: Block | null;
  onUpdate: (id: string, updates: Partial<Block>) => void;
}

function PropertyEditor({ block, onUpdate }: PropertyEditorProps) {
  if (!block) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🎯</div>
        <div style={{ marginBottom: '8px', fontWeight: '600', color: '#94a3b8' }}>
          Select a Block
        </div>
        <div style={{ fontSize: '13px' }}>
          Click on any block to edit its properties
        </div>
      </div>
    );
  }

  const template = blockTemplates.find(t => t.type === block.type);

  return (
    <div>
      {/* Block Name */}
      <div style={styles.propertyGroup}>
        <label style={styles.propertyLabel}>Block Name</label>
        <input
          style={styles.propertyInput}
          value={block.name}
          onChange={(e) => onUpdate(block.id, { name: e.target.value })}
          placeholder="Block name..."
        />
      </div>

      {/* Block Description */}
      <div style={styles.propertyGroup}>
        <label style={styles.propertyLabel}>Description</label>
        <input
          style={styles.propertyInput}
          value={block.description || ''}
          onChange={(e) => onUpdate(block.id, { description: e.target.value })}
          placeholder="Optional description..."
        />
      </div>

      {/* Type-specific properties */}
      {block.type === 'draw' && (
        <>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Number of Cards</label>
            <input
              type="number"
              style={styles.propertyInput}
              value={block.properties?.count || 1}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, count: parseInt(e.target.value) || 1 }
              })}
              min={1}
            />
          </div>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Draw From</label>
            <select
              style={styles.propertySelect}
              value={block.properties?.from || 'deck'}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, from: e.target.value }
              })}
            >
              <option value="deck">Main Deck</option>
              <option value="discard">Discard Pile</option>
              <option value="whiteDeck">White Cards</option>
              <option value="blackDeck">Black Cards</option>
            </select>
          </div>
        </>
      )}

      {block.type === 'chooseCards' && (
        <>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Number to Choose</label>
            <input
              type="number"
              style={styles.propertyInput}
              value={block.properties?.count || 1}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, count: parseInt(e.target.value) || 1 }
              })}
              min={1}
            />
          </div>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Choose From</label>
            <select
              style={styles.propertySelect}
              value={block.properties?.from || 'hand'}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, from: e.target.value }
              })}
            >
              <option value="hand">Player's Hand</option>
              <option value="table">Table</option>
              <option value="submissions">Submissions</option>
            </select>
          </div>
        </>
      )}

      {block.type === 'increment' && (
        <>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Variable Name</label>
            <input
              style={styles.propertyInput}
              value={block.properties?.variable || 'score'}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, variable: e.target.value }
              })}
              placeholder="e.g., score"
            />
          </div>
          <div style={styles.propertyGroup}>
            <label style={styles.propertyLabel}>Add Amount</label>
            <input
              type="number"
              style={styles.propertyInput}
              value={block.properties?.by || 1}
              onChange={(e) => onUpdate(block.id, {
                properties: { ...block.properties, by: parseInt(e.target.value) || 1 }
              })}
            />
          </div>
        </>
      )}

      {block.type === 'announce' && (
        <div style={styles.propertyGroup}>
          <label style={styles.propertyLabel}>Message</label>
          <textarea
            style={{ ...styles.propertyInput, minHeight: '80px', resize: 'vertical' as const }}
            value={block.properties?.message || ''}
            onChange={(e) => onUpdate(block.id, {
              properties: { ...block.properties, message: e.target.value }
            })}
            placeholder="Message to show players..."
          />
        </div>
      )}

      {(block.type === 'round' || block.type === 'turn' || block.type === 'phase') && (
        <div style={styles.propertyGroup}>
          <label style={styles.propertyLabel}>Loop Type</label>
          <select
            style={styles.propertySelect}
            value={block.properties?.iterate || 'once'}
            onChange={(e) => onUpdate(block.id, {
              properties: { ...block.properties, iterate: e.target.value }
            })}
          >
            <option value="once">Run Once</option>
            <option value="forEachPlayer">For Each Player</option>
            <option value="until">Until Condition</option>
            <option value="while">While Condition</option>
            <option value="repeat">Repeat N Times</option>
          </select>
        </div>
      )}

      {/* Help text */}
      <div style={{
        marginTop: '24px',
        padding: '12px',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#60a5fa',
      }}>
        <HelpCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        {template?.description || 'Configure this block\'s behavior'}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN BUILDER PAGE
// =============================================================================

export default function GameBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameIdParam = searchParams.get('id');

  const [gameName, setGameName] = useState('My Custom Game');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(gameIdParam);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(!!gameIdParam);
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: 'setup',
      kind: 'phase',
      type: 'phase',
      name: 'Setup',
      description: 'Initial game setup',
      children: [
        { id: 'shuffle-deck', kind: 'action', type: 'shuffle', name: 'Shuffle Deck', properties: { zone: 'deck' } },
        { id: 'deal-cards', kind: 'action', type: 'draw', name: 'Deal Starting Cards', properties: { count: 7, from: 'deck' } },
      ],
    },
    {
      id: 'main-loop',
      kind: 'round',
      type: 'round',
      name: 'Game Round',
      description: 'Main game loop',
      properties: { iterate: 'until', condition: 'winner' },
      children: [
        {
          id: 'player-turn',
          kind: 'turn',
          type: 'turn',
          name: 'Player Turn',
          properties: { iterate: 'forEachPlayer' },
          children: [
            { id: 'draw-phase', kind: 'action', type: 'draw', name: 'Draw Card', properties: { count: 1 } },
            { id: 'play-phase', kind: 'action', type: 'chooseCards', name: 'Choose Card to Play', properties: { count: 1, from: 'hand' } },
          ],
        },
      ],
    },
  ]);

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const findBlockById = (blocks: Block[], id: string): Block | null => {
    for (const block of blocks) {
      if (block.id === id) return block;
      if (block.children) {
        const found = findBlockById(block.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const updateBlockById = (blocks: Block[], id: string, updates: Partial<Block>): Block[] => {
    return blocks.map(block => {
      if (block.id === id) {
        return { ...block, ...updates };
      }
      if (block.children) {
        return { ...block, children: updateBlockById(block.children, id, updates) };
      }
      return block;
    });
  };

  const deleteBlockById = (blocks: Block[], id: string): Block[] => {
    return blocks.filter(block => {
      if (block.id === id) return false;
      if (block.children) {
        block.children = deleteBlockById(block.children, id);
      }
      return true;
    });
  };

  const addChildToBlock = (blocks: Block[], parentId: string, newBlock: Block): Block[] => {
    return blocks.map(block => {
      if (block.id === parentId) {
        return {
          ...block,
          children: [...(block.children || []), newBlock],
        };
      }
      if (block.children) {
        return { ...block, children: addChildToBlock(block.children, parentId, newBlock) };
      }
      return block;
    });
  };

  const handleUpdate = (id: string, updates: Partial<Block>) => {
    setBlocks(prev => updateBlockById(prev, id, updates));
  };

  const handleDelete = (id: string) => {
    setBlocks(prev => deleteBlockById(prev, id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const handleAddChild = (parentId: string, template: BlockTemplate) => {
    const newBlock: Block = {
      id: generateId(),
      kind: template.kind,
      type: template.type,
      name: template.name,
      description: template.description,
      properties: { ...template.defaultProperties },
      children: template.canHaveChildren ? [] : undefined,
    };
    setBlocks(prev => addChildToBlock(prev, parentId, newBlock));
  };

  const handleDragStart = (e: React.DragEvent, template: BlockTemplate) => {
    e.dataTransfer.setData('templateType', template.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const templateType = e.dataTransfer.getData('templateType');
    const template = blockTemplates.find(t => t.type === templateType);
    if (template) {
      const newBlock: Block = {
        id: generateId(),
        kind: template.kind,
        type: template.type,
        name: template.name,
        description: template.description,
        properties: { ...template.defaultProperties },
        children: template.canHaveChildren ? [] : undefined,
      };
      setBlocks(prev => [...prev, newBlock]);
    }
  };

  // Convert blocks to DSL format for saving
  const blocksToDSL = useCallback(() => {
    return {
      id: gameId || 'new-game',
      name: gameName,
      version: '1.0.0',
      description: 'A custom card game built with the visual editor',
      players: { min: 3, max: 10, initial: [] },
      cardTypes: [
        { type: 'white', name: 'Response Card', display: { color: '#ffffff', textColor: '#1a1a1a', template: '{{text}}' }, properties: [{ name: 'text', type: 'string', label: 'Card Text' }] },
        { type: 'black', name: 'Prompt Card', display: { color: '#1a1a1a', textColor: '#ffffff', template: '{{text}}' }, properties: [{ name: 'text', type: 'string', label: 'Prompt Text' }, { name: 'pick', type: 'number', default: { type: 'literal', value: 1 }, label: 'Cards to Pick' }] },
      ],
      decks: [],
      zones: [
        { name: 'deck', scope: 'shared', visibility: 'private' },
        { name: 'discard', scope: 'shared', visibility: 'public' },
        { name: 'hand', scope: 'perPlayer', visibility: 'owner' },
        { name: 'table', scope: 'shared', visibility: 'public' },
      ],
      setup: { id: 'setup', name: 'Setup', kind: 'phase', children: [] },
      main: { id: 'main', name: 'Main Game', kind: 'game', children: blocks },
      winConditions: [],
    };
  }, [gameId, gameName, blocks]);

  // Load existing game
  useEffect(() => {
    if (!gameIdParam) {
      setLoading(false);
      return;
    }

    const loadGame = async () => {
      try {
        const res = await fetch(`/api/game-kit/dsl/${gameIdParam}`);
        if (!res.ok) throw new Error('Failed to load game');
        const game = await res.json();
        setGameName(game.name);
        setGameId(game.id);
        // Load blocks from gameConfig if it has a main scope with children
        if (game.gameConfig?.main?.children) {
          setBlocks(game.gameConfig.main.children);
        }
      } catch (error) {
        console.error('Failed to load game:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameIdParam]);

  // Save game
  const saveGame = async (): Promise<string | null> => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const dslDefinition = blocksToDSL();

      if (gameId) {
        // Update existing
        const res = await fetch(`/api/game-kit/dsl/${gameId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: gameName, dslDefinition }),
        });
        if (!res.ok) throw new Error('Failed to save');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return gameId;
      } else {
        // Create new
        const res = await fetch('/api/game-kit/dsl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: gameName, dslDefinition }),
        });
        if (!res.ok) throw new Error('Failed to create');
        const game = await res.json();
        setGameId(game.id);
        // Update URL without full navigation
        window.history.replaceState({}, '', `/game-kit/builder?id=${game.id}`);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return game.id;
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Play game
  const handlePlay = async () => {
    const savedId = await saveGame();
    if (savedId) {
      // Generate a room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/play-online/${roomCode}?game=${savedId}`);
    }
  };

  const selectedBlockData = selectedBlock ? findBlockById(blocks, selectedBlock) : null;

  if (loading) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 size={48} style={{ color: '#f97316', animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: '16px', color: '#94a3b8' }}>Loading game...</div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link
            href="/game-kit"
            style={styles.backButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)';
              e.currentTarget.style.color = '#fdba74';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <ArrowLeft size={18} />
            Back
          </Link>

          <div style={styles.title}>
            <Sparkles size={20} style={{ color: '#f97316' }} />
            <input
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fdba74',
                fontSize: '20px',
                fontWeight: 'bold',
                width: '200px',
              }}
            />
          </div>
        </div>

        <div style={styles.headerRight}>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={() => {
              const dsl = blocksToDSL();
              console.log('DSL Definition:', JSON.stringify(dsl, null, 2));
              alert('DSL logged to console');
            }}
          >
            <Code size={16} />
            View Code
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.secondaryButton,
              opacity: saving ? 0.7 : 1,
            }}
            onClick={saveGame}
            disabled={saving}
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : saveStatus === 'saved' ? (
              <Check size={16} style={{ color: '#10b981' }} />
            ) : (
              <Save size={16} />
            )}
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.primaryButton,
              opacity: saving ? 0.7 : 1,
            }}
            onClick={handlePlay}
            disabled={saving}
          >
            <Play size={16} />
            Test Game
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Left Sidebar - Block Palette */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <Palette size={14} style={{ marginRight: '8px' }} />
            Block Palette
          </div>
          <div style={styles.sidebarContent}>
            {Object.entries(templatesByCategory).map(([category, templates]) => (
              <div key={category} style={styles.category}>
                <div style={styles.categoryTitle}>{category}</div>
                <div style={styles.templateList}>
                  {templates.map(template => (
                    <div
                      key={template.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, template)}
                      style={{
                        ...styles.templateBlock,
                        background: `${template.color}10`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${template.color}20`;
                        e.currentTarget.style.borderColor = `${template.color}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${template.color}10`;
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{ ...styles.templateIcon, background: template.color }}>
                        {template.icon}
                      </div>
                      <div style={styles.templateInfo}>
                        <div style={styles.templateName}>{template.name}</div>
                        <div style={styles.templateDesc}>{template.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Canvas */}
        <div
          style={styles.canvas}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
        >
          <div style={styles.canvasInner}>
            {/* Game Info Block */}
            <div style={styles.gameBlock}>
              <div style={styles.gameBlockHeader}>
                <Sparkles size={24} style={{ color: '#f97316' }} />
                <div style={styles.gameBlockTitle}>{gameName}</div>
              </div>

              {/* Blocks */}
              {blocks.map(block => (
                <BlockComponent
                  key={block.id}
                  block={block}
                  depth={0}
                  selected={selectedBlock}
                  onSelect={setSelectedBlock}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  onDrop={(targetId, template) => handleAddChild(targetId, template)}
                />
              ))}

              {/* Root drop zone */}
              {blocks.length === 0 && (
                <div style={{ ...styles.dropZone, padding: '40px' }}>
                  <Plus size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', marginBottom: '4px' }}>
                    Drag blocks here to start building
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>
                    Add rounds, turns, and actions to define your game
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div style={styles.propertiesPanel}>
          <div style={styles.propertiesHeader}>
            <Settings size={16} />
            Properties
          </div>
          <div style={styles.propertiesContent}>
            <PropertyEditor
              block={selectedBlockData}
              onUpdate={handleUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
