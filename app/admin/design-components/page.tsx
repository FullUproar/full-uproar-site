'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Image, FileText, Plus, Grid, List, CheckCircle, Clock, AlertCircle, Upload, Download, Eye } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Game {
  id: number;
  title: string;
  slug: string;
}

interface DesignComponent {
  id: string;
  gameId: number;
  type: string;
  name: string;
  description: string | null;
  status: string;
  previewUrl: string | null;
  notes: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  lastReviewedAt: string | null;
  approvedBy: string | null;
  game?: Game;
}

const componentTypes = [
  { value: 'CARD_FACE', label: 'Card Face', icon: '🃏', color: '#3b82f6' },
  { value: 'BOX', label: 'Box', icon: '📦', color: '#10b981' },
  { value: 'INSTRUCTIONS', label: 'Instructions', icon: '📄', color: '#8b5cf6' }
];

const componentStatuses = [
  { value: 'IN_DRAFT', label: 'In Draft', color: '#6b7280', icon: Clock },
  { value: 'READY_FOR_REVIEW', label: 'Ready for Review', color: '#fbbf24', icon: AlertCircle },
  { value: 'READY_FOR_PRINT', label: 'Ready for Print', color: '#10b981', icon: CheckCircle }
];

export default function DesignComponentsPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const [components, setComponents] = useState<DesignComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<DesignComponent | null>(null);

  // Bulk create form
  const [bulkType, setBulkType] = useState('CARD_FACE');
  const [bulkCount, setBulkCount] = useState(54);
  const [bulkPrefix, setBulkPrefix] = useState('');

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      fetchComponents();
    }
  }, [selectedGame, filterType, filterStatus]);

  const fetchGames = async () => {
    try {
      const response = await fetch('/api/admin/games');
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      setGames(data);
      if (data.length > 0) {
        setSelectedGame(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComponents = async () => {
    if (!selectedGame) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('gameId', selectedGame.toString());
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(`/api/admin/design-components?${params}`);
      if (!response.ok) throw new Error('Failed to fetch components');
      const data = await response.json();
      setComponents(data);
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreate = async () => {
    if (!selectedGame || !bulkPrefix || bulkCount < 1) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/design-components/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGame,
          type: bulkType,
          count: bulkCount,
          prefix: bulkPrefix
        })
      });

      if (!response.ok) throw new Error('Failed to create components');
      
      setShowBulkCreate(false);
      setBulkPrefix('');
      fetchComponents();
    } catch (error) {
      console.error('Error creating components:', error);
      alert('Failed to create components');
    }
  };

  const updateComponentStatus = async (componentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/design-components/${componentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      fetchComponents();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    const statusConfig = componentStatuses.find(s => s.value === status);
    if (!statusConfig) return null;
    const Icon = statusConfig.icon;
    return <Icon style={{ width: '1rem', height: '1rem', color: statusConfig.color }} />;
  };

  const getProgress = () => {
    if (components.length === 0) return { draft: 0, review: 0, print: 0, total: 0 };
    
    const draft = components.filter(c => c.status === 'IN_DRAFT').length;
    const review = components.filter(c => c.status === 'READY_FOR_REVIEW').length;
    const print = components.filter(c => c.status === 'READY_FOR_PRINT').length;
    
    return { draft, review, print, total: components.length };
  };

  const progress = getProgress();
  const progressPercent = progress.total > 0 ? Math.round((progress.print / progress.total) * 100) : 0;

  const currentGame = games.find(g => g.id === selectedGame);

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.header}>
        <button onClick={() => router.push('/admin')} style={adminStyles.backButton}>
          <ArrowLeft style={{ width: '1.25rem', height: '1.25rem' }} />
          Back to Admin
        </button>
        <h1 style={adminStyles.title}>Design Components</h1>
      </div>

      {/* Game Selector */}
      <div style={{ ...adminStyles.card, marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select
            value={selectedGame || ''}
            onChange={(e) => setSelectedGame(parseInt(e.target.value))}
            style={{ ...adminStyles.select, flex: 1 }}
          >
            <option value="">Select a game...</option>
            {games.map(game => (
              <option key={game.id} value={game.id}>{game.title}</option>
            ))}
          </select>
          
          <button
            onClick={() => setShowBulkCreate(true)}
            style={adminStyles.button}
            disabled={!selectedGame}
          >
            <Plus style={{ width: '1rem', height: '1rem' }} />
            Bulk Create Components
          </button>
        </div>
      </div>

      {selectedGame && currentGame && (
        <>
          {/* Progress Overview */}
          <div style={{ ...adminStyles.card, marginBottom: '2rem' }}>
            <h2 style={adminStyles.sectionTitle}>
              {currentGame.title} - Design Progress
            </h2>
            
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  Overall Progress
                </span>
                <span style={{ color: '#fde68a', fontWeight: 'bold' }}>
                  {progressPercent}% Complete
                </span>
              </div>
              
              <div style={{
                height: '2rem',
                background: '#1f2937',
                borderRadius: '0.5rem',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #f97316, #fbbf24)',
                  transition: 'width 0.5s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {progressPercent > 10 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#000' }}>
                      {progress.print}/{progress.total}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginTop: '1.5rem'
              }}>
                {componentStatuses.map(status => {
                  const count = components.filter(c => c.status === status.value).length;
                  const Icon = status.icon;
                  return (
                    <div key={status.value} style={{
                      padding: '1rem',
                      background: '#111827',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <Icon style={{ width: '2rem', height: '2rem', color: status.color, margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: status.color }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {status.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filters and View Toggle */}
          <div style={{ ...adminStyles.card, marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={adminStyles.select}
              >
                <option value="all">All Types</option>
                {componentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={adminStyles.select}
              >
                <option value="all">All Statuses</option>
                {componentStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>

              <div style={{ flex: 1 }} />

              <button
                onClick={() => setViewMode('grid')}
                style={{
                  ...adminStyles.button,
                  background: viewMode === 'grid' ? '#f97316' : '#374151'
                }}
              >
                <Grid style={{ width: '1rem', height: '1rem' }} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  ...adminStyles.button,
                  background: viewMode === 'list' ? '#f97316' : '#374151'
                }}
              >
                <List style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>
          </div>

          {/* Components Display */}
          <div style={adminStyles.card}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                Loading components...
              </div>
            ) : components.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                <p style={{ marginBottom: '1rem' }}>No components found</p>
                <button
                  onClick={() => setShowBulkCreate(true)}
                  style={adminStyles.button}
                >
                  Create Components
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                {components.map(component => {
                  const typeConfig = componentTypes.find(t => t.value === component.type);
                  return (
                    <div
                      key={component.id}
                      style={{
                        background: '#111827',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        border: '2px solid #374151',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onClick={() => setSelectedComponent(component)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#f97316';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {component.previewUrl ? (
                        <img
                          src={component.previewUrl}
                          alt={component.name}
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '0.25rem',
                            marginBottom: '0.5rem'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '150px',
                          background: '#1f2937',
                          borderRadius: '0.25rem',
                          marginBottom: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3rem'
                        }}>
                          {typeConfig?.icon}
                        </div>
                      )}
                      
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        color: '#fde68a',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {component.name}
                      </h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {getStatusIcon(component.status)}
                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {componentStatuses.find(s => s.value === component.status)?.label}
                        </span>
                      </div>
                      
                      <select
                        value={component.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateComponentStatus(component.id, e.target.value);
                        }}
                        style={{
                          ...adminStyles.select,
                          fontSize: '0.75rem',
                          padding: '0.25rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {componentStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            ) : (
              <table style={adminStyles.table}>
                <thead>
                  <tr>
                    <th style={adminStyles.tableHeader}>Preview</th>
                    <th style={adminStyles.tableHeader}>Name</th>
                    <th style={adminStyles.tableHeader}>Type</th>
                    <th style={adminStyles.tableHeader}>Status</th>
                    <th style={adminStyles.tableHeader}>Last Updated</th>
                    <th style={adminStyles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map(component => {
                    const typeConfig = componentTypes.find(t => t.value === component.type);
                    return (
                      <tr key={component.id} style={adminStyles.tableRow}>
                        <td style={adminStyles.tableCell}>
                          {component.previewUrl ? (
                            <img
                              src={component.previewUrl}
                              alt={component.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '0.25rem'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              background: '#1f2937',
                              borderRadius: '0.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem'
                            }}>
                              {typeConfig?.icon}
                            </div>
                          )}
                        </td>
                        <td style={adminStyles.tableCell}>{component.name}</td>
                        <td style={adminStyles.tableCell}>
                          <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>
                            {typeConfig?.icon}
                          </span>
                          {typeConfig?.label}
                        </td>
                        <td style={adminStyles.tableCell}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {getStatusIcon(component.status)}
                            <select
                              value={component.status}
                              onChange={(e) => updateComponentStatus(component.id, e.target.value)}
                              style={{
                                ...adminStyles.select,
                                fontSize: '0.875rem',
                                padding: '0.25rem 0.5rem'
                              }}
                            >
                              {componentStatuses.map(status => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td style={adminStyles.tableCell}>
                          {new Date(component.updatedAt).toLocaleDateString()}
                        </td>
                        <td style={adminStyles.tableCell}>
                          <button
                            onClick={() => setSelectedComponent(component)}
                            style={{
                              ...adminStyles.button,
                              fontSize: '0.75rem',
                              padding: '0.25rem 0.5rem'
                            }}
                          >
                            <Eye style={{ width: '0.875rem', height: '0.875rem' }} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Bulk Create Modal */}
      {showBulkCreate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1f2937',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            border: '3px solid #f97316'
          }}>
            <h2 style={{ ...adminStyles.sectionTitle, marginBottom: '1.5rem' }}>
              Bulk Create Components
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ ...adminStyles.label, marginBottom: '0.5rem', display: 'block' }}>
                  Component Type
                </label>
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                  style={adminStyles.select}
                >
                  {componentTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ ...adminStyles.label, marginBottom: '0.5rem', display: 'block' }}>
                  Number of Components
                </label>
                <input
                  type="number"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value) || 0)}
                  style={adminStyles.input}
                  min="1"
                  max="200"
                />
                {bulkType === 'CARD_FACE' && (
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    Tip: 54 for standard deck (fronts) + 3 for unique backs = 57 total
                  </p>
                )}
              </div>
              
              <div>
                <label style={{ ...adminStyles.label, marginBottom: '0.5rem', display: 'block' }}>
                  Name Prefix
                </label>
                <input
                  type="text"
                  value={bulkPrefix}
                  onChange={(e) => setBulkPrefix(e.target.value)}
                  placeholder={`e.g., "${currentGame?.title || 'Game'} Card Face"`}
                  style={adminStyles.input}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                  Will create: "{bulkPrefix || 'Component'} 001", "{bulkPrefix || 'Component'} 002", etc.
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setShowBulkCreate(false)}
                style={{ ...adminStyles.button, background: '#374151' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCreate}
                style={adminStyles.button}
                disabled={!bulkPrefix || bulkCount < 1}
              >
                Create {bulkCount} Components
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component Detail Modal */}
      {selectedComponent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={() => setSelectedComponent(null)}
        >
          <div style={{
            background: '#1f2937',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '3px solid #f97316'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ ...adminStyles.sectionTitle, marginBottom: '1.5rem' }}>
              {selectedComponent.name}
            </h2>
            
            {selectedComponent.previewUrl ? (
              <img
                src={selectedComponent.previewUrl}
                alt={selectedComponent.name}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  background: '#111827'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '300px',
                background: '#111827',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '4rem' }}>
                  {componentTypes.find(t => t.value === selectedComponent.type)?.icon}
                </span>
                <button style={adminStyles.button}>
                  <Upload style={{ width: '1rem', height: '1rem' }} />
                  Upload Preview
                </button>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={adminStyles.label}>Type</label>
                <p style={{ color: '#fde68a' }}>
                  {componentTypes.find(t => t.value === selectedComponent.type)?.label}
                </p>
              </div>
              
              <div>
                <label style={adminStyles.label}>Status</label>
                <select
                  value={selectedComponent.status}
                  onChange={(e) => {
                    updateComponentStatus(selectedComponent.id, e.target.value);
                    setSelectedComponent({ ...selectedComponent, status: e.target.value });
                  }}
                  style={adminStyles.select}
                >
                  {componentStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={adminStyles.label}>Notes</label>
                <textarea
                  value={selectedComponent.notes || ''}
                  placeholder="Add design notes, feedback, or requirements..."
                  style={{
                    ...adminStyles.input,
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  onChange={(e) => {
                    // Would need to implement note saving
                  }}
                />
              </div>
            </div>
            
            <button
              onClick={() => setSelectedComponent(null)}
              style={{ ...adminStyles.button, marginTop: '1rem' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}