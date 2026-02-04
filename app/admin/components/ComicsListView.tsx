'use client';

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { BookOpen, Plus, Edit2, Trash2, Eye, Image, Calendar } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Comic {
  id: number;
  title: string;
  episode: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

interface ComicsListViewProps {
  onEdit?: (comic: Comic) => void;
  onNew?: () => void;
}

export default function ComicsListView({ onEdit, onNew }: ComicsListViewProps) {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComics();
  }, []);

  const fetchComics = async () => {
    try {
      const response = await fetch('/api/comics');
      if (response.ok) {
        const data = await response.json();
        setComics(data);
      }
    } catch (error) {
      console.error('Error fetching comics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this comic?')) return;
    
    try {
      const response = await fetch(`/api/comics/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchComics();
      }
    } catch (error) {
      console.error('Error deleting comic:', error);
    }
  };

  const filteredComics = comics.filter(comic =>
    comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comic.episode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comic.description && comic.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#FBDB65' }}>Loading comics...</p>
      </div>
    );
  }

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Comics Management</h1>
        <p style={adminStyles.subtitle}>Manage your comic episodes</p>
      </div>

      <div style={adminStyles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <input
              type="text"
              placeholder="Search comics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...adminStyles.input, maxWidth: '400px' }}
            />
          </div>
          
          <button
            onClick={onNew}
            style={{
              ...adminStyles.primaryButton,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} />
            New Comic
          </button>
        </div>

        {filteredComics.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            {searchTerm ? 'No comics found matching your search.' : 'No comics yet. Create your first comic!'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredComics.map((comic) => (
              <div
                key={comic.id}
                style={adminStyles.card}
                {...adminStyles.hoverEffects.card}
              >
                <div style={{ aspectRatio: '16/9', background: '#1e293b', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden', position: 'relative' }}>
                  {comic.imageUrl ? (
                    <NextImage
                      src={comic.imageUrl}
                      alt={comic.title}
                      fill
                      unoptimized
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#475569'
                    }}>
                      <BookOpen size={48} />
                    </div>
                  )}
                </div>
                
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FBDB65', marginBottom: '8px' }}>
                  {comic.title}
                </h3>
                
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
                  Episode: {comic.episode}
                </p>
                
                {comic.description && (
                  <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px', lineHeight: '1.4' }}>
                    {comic.description.length > 100 
                      ? comic.description.substring(0, 100) + '...' 
                      : comic.description}
                  </p>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#64748b', fontSize: '12px' }}>
                  <Calendar size={14} />
                  {new Date(comic.createdAt).toLocaleDateString()}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onEdit?.(comic)}
                    style={adminStyles.outlineButton}
                    title="Edit comic"
                  >
                    <Edit2 size={16} />
                  </button>
                  
                  <a
                    href={`/comics/${comic.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...adminStyles.outlineButton, textDecoration: 'none' }}
                    title="View comic"
                  >
                    <Eye size={16} />
                  </a>
                  
                  <button
                    onClick={() => handleDelete(comic.id)}
                    style={adminStyles.dangerButton}
                    title="Delete comic"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}