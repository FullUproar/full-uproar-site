'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, Users, TrendingUp, Clock, Pin, Lock,
  Search, Filter, Plus, ChevronRight, Eye, MessageCircle
} from 'lucide-react';

interface MessageBoard {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  threadCount: number;
  postCount: number;
  lastPost?: {
    threadTitle: string;
    threadSlug: string;
    authorName: string;
    createdAt: string;
  };
}

interface MessageThread {
  id: number;
  title: string;
  slug: string;
  authorName: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  postCount: number;
  lastPostAt: string;
  createdAt: string;
}

export default function ForumView() {
  const router = useRouter();
  const [boards, setBoards] = useState<MessageBoard[]>([]);
  const [popularThreads, setPopularThreads] = useState<MessageThread[]>([]);
  const [recentThreads, setRecentThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchForumData();
  }, []);

  const fetchForumData = async () => {
    try {
      const [boardsRes, popularRes, recentRes] = await Promise.all([
        fetch('/api/forum/boards'),
        fetch('/api/forum/threads/popular'),
        fetch('/api/forum/threads/recent')
      ]);

      const [boardsData, popularData, recentData] = await Promise.all([
        boardsRes.json(),
        popularRes.json(),
        recentRes.json()
      ]);

      setBoards(boardsData);
      setPopularThreads(popularData);
      setRecentThreads(recentData);
    } catch (error) {
      console.error('Error fetching forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#0f172a',
      color: '#e2e8f0'
    },
    header: {
      background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
      padding: '60px 0',
      marginBottom: '40px'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px 48px'
    },
    boardCard: {
      background: 'rgba(30, 41, 59, 0.95)',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '16px',
      transition: 'all 0.3s',
      cursor: 'pointer'
    },
    threadRow: {
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      background: 'rgba(30, 41, 59, 0.5)',
      border: '1px solid #334155',
      borderRadius: '8px',
      marginBottom: '8px',
      transition: 'all 0.2s',
      textDecoration: 'none',
      color: 'inherit'
    },
    stat: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      padding: '8px 16px',
      background: 'rgba(51, 65, 85, 0.5)',
      borderRadius: '8px',
      minWidth: '80px'
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'rgba(30, 41, 59, 0.95)',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '24px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh' 
        }}>
          <p style={{ color: '#fdba74' }}>Loading forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '12px' }}>
            Community Forum
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9 }}>
            Join the Full Uproar community discussion
          </p>
        </div>
      </div>

      <div style={styles.content}>
        {/* Search Bar */}
        <div style={styles.searchBar}>
          <Search size={20} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search threads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            style={{
              padding: '8px 16px',
              background: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={18} />
            New Thread
          </button>
        </div>

        {/* Forum Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <Users size={32} style={{ color: '#f97316', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>1,234</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Active Members</div>
          </div>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <MessageSquare size={32} style={{ color: '#3b82f6', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>5,678</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Total Threads</div>
          </div>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <MessageCircle size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>12,345</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Total Posts</div>
          </div>
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <TrendingUp size={32} style={{ color: '#ec4899', marginBottom: '8px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>89</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Online Now</div>
          </div>
        </div>

        {/* Message Boards */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            Message Boards
          </h2>
          {boards.map((board) => (
            <div
              key={board.id}
              style={styles.boardCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f97316';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              onClick={() => router.push(`/forum/${board.slug}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    {board.icon && <span style={{ fontSize: '24px' }}>{board.icon}</span>}
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fdba74' }}>
                      {board.name}
                    </h3>
                  </div>
                  {board.description && (
                    <p style={{ color: '#94a3b8', marginBottom: '12px' }}>
                      {board.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#64748b' }}>
                    <span>{board.threadCount} threads</span>
                    <span>{board.postCount} posts</span>
                  </div>
                </div>
                {board.lastPost && (
                  <div style={{
                    background: 'rgba(51, 65, 85, 0.5)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minWidth: '250px'
                  }}>
                    <div style={{ color: '#e2e8f0', marginBottom: '4px' }}>
                      {board.lastPost.threadTitle}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                      by {board.lastPost.authorName} • {board.lastPost.createdAt}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Popular & Recent Threads */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Popular Threads */}
          <div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={20} style={{ color: '#f97316' }} />
              Popular Threads
            </h2>
            {popularThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/thread/${thread.slug}`}
                style={styles.threadRow}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                  e.currentTarget.style.borderColor = '#f97316';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                  e.currentTarget.style.borderColor = '#334155';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {thread.isPinned && <Pin size={16} style={{ color: '#f97316' }} />}
                    {thread.isLocked && <Lock size={16} style={{ color: '#ef4444' }} />}
                    <span style={{ fontWeight: 'bold' }}>{thread.title}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                    by {thread.authorName} • {thread.postCount} replies
                  </div>
                </div>
                <div style={styles.stat}>
                  <Eye size={16} style={{ color: '#94a3b8', marginBottom: '4px' }} />
                  <span style={{ fontSize: '14px' }}>{thread.viewCount}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Threads */}
          <div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Clock size={20} style={{ color: '#3b82f6' }} />
              Recent Threads
            </h2>
            {recentThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/forum/thread/${thread.slug}`}
                style={styles.threadRow}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                  e.currentTarget.style.borderColor = '#334155';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {thread.isPinned && <Pin size={16} style={{ color: '#f97316' }} />}
                    {thread.isLocked && <Lock size={16} style={{ color: '#ef4444' }} />}
                    <span style={{ fontWeight: 'bold' }}>{thread.title}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                    by {thread.authorName} • {new Date(thread.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={styles.stat}>
                  <MessageCircle size={16} style={{ color: '#94a3b8', marginBottom: '4px' }} />
                  <span style={{ fontSize: '14px' }}>{thread.postCount}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}