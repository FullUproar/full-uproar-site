'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, Plus, Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface NewsPost {
  id: number;
  title: string;
  excerpt: string;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewsListViewProps {
  onEdit?: (post: NewsPost) => void;
  onNew?: () => void;
}

export default function NewsListView({ onEdit, onNew }: NewsListViewProps) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchPosts();
  }, [pagination.page]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/news?page=${pagination.page}&limit=${pagination.limit}`);
      if (response.ok) {
        const data = await response.json();
        // Handle both formats: new pagination format and legacy array format
        if (data.news && data.pagination) {
          setPosts(data.news);
          setPagination(prev => ({ ...prev, ...data.pagination }));
        } else if (Array.isArray(data)) {
          setPosts(data);
        }
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this news post?')) return;

    try {
      const response = await fetch(`/api/news?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPosts();
      }
    } catch (error) {
      console.error('Error deleting news post:', error);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={adminStyles.section}>
        <p style={{ color: '#fdba74' }}>Loading news posts...</p>
      </div>
    );
  }

  return (
    <>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>News Management</h1>
        <p style={adminStyles.subtitle}>Manage news posts and announcements</p>
      </div>

      <div style={adminStyles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
            <input
              type="text"
              placeholder="Search news posts..."
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
            <Plus size={20} />
            New Post
          </button>
        </div>

        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <Newspaper size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No news posts found.</p>
            {posts.length === 0 && (
              <button
                onClick={onNew}
                style={{
                  ...adminStyles.primaryButton,
                  marginTop: '16px'
                }}
              >
                Create Your First Post
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={adminStyles.table}>
              <thead>
                <tr>
                  <th style={adminStyles.tableHeader}>Title</th>
                  <th style={adminStyles.tableHeader}>Excerpt</th>
                  <th style={adminStyles.tableHeader}>Created</th>
                  <th style={adminStyles.tableHeader}>Updated</th>
                  <th style={{ ...adminStyles.tableHeader, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post.id} style={adminStyles.tableRow}>
                    <td style={adminStyles.tableCell}>
                      <div style={{ fontWeight: 'bold', color: '#f97316', marginBottom: '4px' }}>
                        {post.title}
                      </div>
                    </td>
                    <td style={adminStyles.tableCell}>
                      <div style={{
                        maxWidth: '300px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#94a3b8'
                      }}>
                        {post.excerpt}
                      </div>
                    </td>
                    <td style={adminStyles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                        <Calendar size={14} />
                        {formatDate(post.createdAt)}
                      </div>
                    </td>
                    <td style={adminStyles.tableCell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                        <Clock size={14} />
                        {formatDate(post.updatedAt)}
                      </div>
                    </td>
                    <td style={{ ...adminStyles.tableCell, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => onEdit && onEdit(post)}
                          style={{
                            ...adminStyles.iconButton,
                            background: '#3b82f6',
                          }}
                          title="Edit post"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          style={{
                            ...adminStyles.iconButton,
                            background: '#ef4444',
                          }}
                          title="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              style={{
                ...adminStyles.secondaryButton,
                opacity: pagination.page === 1 ? 0.5 : 1,
                cursor: pagination.page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ color: '#94a3b8' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              style={{
                ...adminStyles.secondaryButton,
                opacity: pagination.page === pagination.totalPages ? 0.5 : 1,
                cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
