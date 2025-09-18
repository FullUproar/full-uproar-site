'use client';

import { useState, useEffect } from 'react';
import { adminStyles } from '../styles/adminStyles';
import { useToast } from '@/lib/hooks/useToast';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: { name: string; color: string }[];
  assignees: string[];
  created_at: string;
  updated_at: string;
  html_url: string;
  user: string;
}

export default function SiteIssuesPage() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'closed' | 'all'>('open');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const { addToast } = useToast();
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch issues from GitHub
  const fetchIssues = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`/api/admin/github-issues?state=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch issues');
      const data = await response.json();
      setIssues(data.issues);
      setLastSync(new Date());
      addToast('Issues synced with GitHub', 'success');
    } catch (error) {
      console.error('Error fetching issues:', error);
      addToast('Failed to fetch issues', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    // Auto-sync every 5 minutes
    const interval = setInterval(fetchIssues, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filter]);

  // Create new issue
  const handleCreateIssue = async () => {
    if (!newIssue.title) {
      addToast('Title is required', 'error');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/github-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create issue');
      }

      const data = await response.json();
      addToast('Issue created successfully', 'success');
      setShowCreateModal(false);
      setNewIssue({ title: '', description: '' });
      fetchIssues(); // Refresh list
    } catch (error: any) {
      console.error('Error creating issue:', error);
      addToast(error.message || 'Failed to create issue', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Update issue status
  const handleUpdateStatus = async (issueNumber: number, currentState: string) => {
    const newState = currentState === 'open' ? 'closed' : 'open';
    
    try {
      const response = await fetch('/api/admin/github-issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueNumber, state: newState })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update issue');
      }

      addToast(`Issue ${newState === 'open' ? 'reopened' : 'closed'} successfully`, 'success');
      fetchIssues(); // Refresh list
    } catch (error: any) {
      console.error('Error updating issue:', error);
      addToast(error.message || 'Failed to update issue', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div style={adminStyles.container}>
        <div style={adminStyles.loadingState}>Loading issues...</div>
      </div>
    );
  }

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.header}>
        <h1 style={adminStyles.title}>Site Issues</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {lastSync && (
            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Last sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchIssues}
            disabled={syncing}
            style={{
              ...adminStyles.button,
              opacity: syncing ? 0.5 : 1,
              cursor: syncing ? 'not-allowed' : 'pointer'
            }}
          >
            {syncing ? 'Syncing...' : '🔄 Sync with GitHub'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              ...adminStyles.button,
              background: '#f97316',
              color: '#0a0a0a'
            }}
          >
            + New Issue
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...adminStyles.card, marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ color: '#fde68a' }}>Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={adminStyles.select}
          >
            <option value="open">Open Issues</option>
            <option value="closed">Closed Issues</option>
            <option value="all">All Issues</option>
          </select>
          <span style={{ color: '#6b7280', marginLeft: 'auto' }}>
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Issues List */}
      <div style={adminStyles.grid}>
        {issues.map((issue) => (
          <div key={issue.id} style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '0.5rem' }}>
                  #{issue.number} {issue.title}
                </h3>
                
                {/* Labels */}
                {issue.labels.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {issue.labels.map((label) => (
                      <span
                        key={label.name}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          backgroundColor: `#${label.color}`,
                          color: '#000',
                          fontWeight: 'bold'
                        }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}

                <p style={{ 
                  color: '#e2e8f0', 
                  marginBottom: '1rem',
                  maxHeight: '3rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {issue.body || 'No description provided'}
                </p>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>By: {issue.user}</span>
                  <span>Created: {formatDate(issue.created_at)}</span>
                  {issue.assignees.length > 0 && (
                    <span>Assigned to: {issue.assignees.join(', ')}</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    backgroundColor: issue.state === 'open' ? '#22c55e' : '#6b7280',
                    color: '#0a0a0a'
                  }}
                >
                  {issue.state.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => handleUpdateStatus(issue.number, issue.state)}
                style={{
                  ...adminStyles.button,
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem'
                }}
              >
                {issue.state === 'open' ? 'Close Issue' : 'Reopen Issue'}
              </button>
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  ...adminStyles.button,
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                View on GitHub ↗
              </a>
            </div>
          </div>
        ))}
      </div>

      {issues.length === 0 && (
        <div style={adminStyles.emptyState}>
          <p>No {filter !== 'all' ? filter : ''} issues found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ ...adminStyles.button, marginTop: '1rem' }}
          >
            Create First Issue
          </button>
        </div>
      )}

      {/* Create Issue Modal */}
      {showCreateModal && (
        <div style={adminStyles.modal}>
          <div style={adminStyles.modalContent}>
            <h2 style={adminStyles.modalTitle}>Create New Issue</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={adminStyles.label}>Title *</label>
              <input
                type="text"
                value={newIssue.title}
                onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                style={adminStyles.input}
                placeholder="Brief description of the issue"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={adminStyles.label}>Description</label>
              <textarea
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                style={{ ...adminStyles.input, minHeight: '150px', resize: 'vertical' }}
                placeholder="Detailed description, steps to reproduce, expected behavior, etc."
              />
            </div>

            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Note: This will create an issue in the FullUproar/full-uproar-site GitHub repository
            </div>

            <div style={adminStyles.modalActions}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewIssue({ title: '', description: '' });
                }}
                style={adminStyles.secondaryButton}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIssue}
                style={{
                  ...adminStyles.button,
                  opacity: creating ? 0.5 : 1,
                  cursor: creating ? 'not-allowed' : 'pointer'
                }}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}