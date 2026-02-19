'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navigation from '@/app/components/Navigation';
import {
  ArrowLeft, Plus, Pin, Lock, MessageCircle, Eye, Clock,
  TrendingUp, Filter, LogIn, Crown, Users
} from 'lucide-react';

interface Board {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  accessLevel?: string;
}

interface Thread {
  id: number;
  title: string;
  slug: string;
  authorName: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  postCount: number;
  createdAt: string;
  lastPostAt: string;
  lastPostAuthor: string;
}

interface AccessDeniedInfo {
  accessDenied: boolean;
  accessLevel: string;
  boardName: string;
  threadCount: number;
  message: string;
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isSignedIn = !!session;
  const boardSlug = params.board as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'lastPostAt' | 'createdAt' | 'viewCount'>('lastPostAt');
  const [accessDenied, setAccessDenied] = useState<AccessDeniedInfo | null>(null);

  useEffect(() => {
    fetchBoardAndThreads();
  }, [boardSlug, page, sortBy]);

  const fetchBoardAndThreads = async () => {
    try {
      setLoading(true);
      setAccessDenied(null);

      // Fetch board info from categories
      const boardsRes = await fetch('/api/forum/boards');
      const boardsData = await boardsRes.json();

      // Find board in categories
      let currentBoard: Board | null = null;
      for (const category of boardsData.categories || []) {
        const found = category.boards.find((b: Board) => b.slug === boardSlug);
        if (found) {
          currentBoard = found;
          break;
        }
      }

      if (!currentBoard) {
        router.push('/forum');
        return;
      }

      setBoard(currentBoard);

      // Fetch threads
      const threadsRes = await fetch(
        `/api/forum/threads?board=${boardSlug}&page=${page}&sortBy=${sortBy}`
      );
      const data = await threadsRes.json();

      // Check if access was denied
      if (data.accessDenied) {
        setAccessDenied({
          accessDenied: true,
          accessLevel: data.accessLevel,
          boardName: data.boardName,
          threadCount: data.threadCount,
          message: data.message
        });
        setThreads([]);
      } else {
        setThreads(data.threads || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      color: '#e2e8f0'
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
    },
    header: {
      background: 'rgba(30, 41, 59, 0.95)',
      border: '2px solid rgba(255, 130, 0, 0.3)',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      backdropFilter: 'blur(10px)'
    },
    threadList: {
      background: 'rgba(30, 41, 59, 0.95)',
      border: '2px solid rgba(255, 130, 0, 0.3)',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    threadRow: {
      display: 'flex',
      alignItems: 'center',
      padding: '1rem',
      borderBottom: '1px solid rgba(255, 130, 0, 0.2)',
      transition: 'background 0.2s',
      textDecoration: 'none',
      color: 'inherit'
    },
    stat: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      minWidth: '60px',
      padding: '0 0.5rem'
    },
    sortButton: {
      padding: '8px 16px',
      background: 'transparent',
      border: '1px solid rgba(255, 130, 0, 0.3)',
      borderRadius: '6px',
      color: '#FBDB65',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Navigation />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh' 
        }}>
          <p style={{ color: '#FBDB65' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navigation />
      
      <div style={styles.content}>
        <Link 
          href="/forum" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#FBDB65', 
            marginBottom: '1rem',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={20} />
          Back to Forum
        </Link>

        {/* Board Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {board?.icon && <span style={{ fontSize: '32px' }}>{board.icon}</span>}
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FF8200' }}>
                  {board?.name}
                </h1>
              </div>
              {board?.description && (
                <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
                  {board.description}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push(`/forum/new-thread?board=${boardSlug}`)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '16px'
              }}
            >
              <Plus size={20} />
              New Thread
            </button>
          </div>
        </div>

        {/* Sort Options */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1rem',
          alignItems: 'center'
        }}>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>Sort by:</span>
          <button
            onClick={() => setSortBy('lastPostAt')}
            style={{
              ...styles.sortButton,
              ...(sortBy === 'lastPostAt' ? { 
                background: 'rgba(255, 130, 0, 0.2)',
                borderColor: '#FF8200'
              } : {})
            }}
          >
            <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Recent Activity
          </button>
          <button
            onClick={() => setSortBy('createdAt')}
            style={{
              ...styles.sortButton,
              ...(sortBy === 'createdAt' ? { 
                background: 'rgba(255, 130, 0, 0.2)',
                borderColor: '#FF8200'
              } : {})
            }}
          >
            <Plus size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Newest
          </button>
          <button
            onClick={() => setSortBy('viewCount')}
            style={{
              ...styles.sortButton,
              ...(sortBy === 'viewCount' ? { 
                background: 'rgba(255, 130, 0, 0.2)',
                borderColor: '#FF8200'
              } : {})
            }}
          >
            <TrendingUp size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Most Viewed
          </button>
        </div>

        {/* Access Denied State */}
        {accessDenied && (
          <div style={{
            ...styles.threadList,
            padding: '3rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              background: accessDenied.accessLevel === 'SUBSCRIBERS_ONLY'
                ? 'linear-gradient(135deg, #FF8200, #ea580c)'
                : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {accessDenied.accessLevel === 'SUBSCRIBERS_ONLY' ? (
                <Crown size={36} style={{ color: 'white' }} />
              ) : accessDenied.accessLevel === 'PRIVATE' ? (
                <Lock size={36} style={{ color: 'white' }} />
              ) : (
                <Users size={36} style={{ color: 'white' }} />
              )}
            </div>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#e2e8f0',
              marginBottom: '0.75rem'
            }}>
              {accessDenied.accessLevel === 'SUBSCRIBERS_ONLY'
                ? 'Afterroar+ Exclusive'
                : accessDenied.accessLevel === 'PRIVATE'
                ? 'Private Board'
                : 'Members Only'}
            </h2>

            <p style={{
              color: '#94a3b8',
              marginBottom: '1rem',
              maxWidth: '400px',
              margin: '0 auto 1rem'
            }}>
              {accessDenied.message}
            </p>

            <p style={{
              color: '#64748b',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              {accessDenied.threadCount} {accessDenied.threadCount === 1 ? 'thread' : 'threads'} waiting for you
            </p>

            {!isSignedIn && accessDenied.accessLevel === 'MEMBERS_ONLY' && (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href={`/sign-in?redirect_url=/forum/${boardSlug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  Already a member? Sign in
                </Link>
                <Link
                  href={`/sign-up?redirect_url=/forum/${boardSlug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  Create Free Account
                </Link>
              </div>
            )}

            {isSignedIn && accessDenied.accessLevel === 'SUBSCRIBERS_ONLY' && (
              <Link
                href="/afterroar"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  textDecoration: 'none'
                }}
              >
                <Crown size={18} />
                Learn about Afterroar+
              </Link>
            )}

            {!isSignedIn && accessDenied.accessLevel === 'SUBSCRIBERS_ONLY' && (
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href={`/sign-in?redirect_url=/forum/${boardSlug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/afterroar"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  <Crown size={18} />
                  Learn about Afterroar+
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Threads List */}
        {!accessDenied && (
        <div style={styles.threadList}>
          {threads.length === 0 ? (
            <div style={{
              padding: '4rem',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              <p style={{ marginBottom: '1rem' }}>No threads yet in this board.</p>
              <p>Be the first to start a discussion!</p>
            </div>
          ) : (
            threads.map((thread, index) => (
              <Link
                key={thread.id}
                href={`/forum/${boardSlug}/${thread.slug}`}
                style={{
                  ...styles.threadRow,
                  ...(index === threads.length - 1 ? { borderBottom: 'none' } : {})
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 130, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {thread.isPinned && (
                      <span title="Pinned">
                        <Pin size={16} style={{ color: '#FF8200' }} />
                      </span>
                    )}
                    {thread.isLocked && (
                      <span title="Locked">
                        <Lock size={16} style={{ color: '#ef4444' }} />
                      </span>
                    )}
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{thread.title}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                    Started by {thread.authorName} • {formatTimeAgo(thread.createdAt)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Last reply by {thread.lastPostAuthor} • {formatTimeAgo(thread.lastPostAt)}
                  </div>
                </div>
                
                <div style={styles.stat}>
                  <MessageCircle size={20} style={{ color: '#94a3b8', marginBottom: '4px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{thread.postCount}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>replies</span>
                </div>
                
                <div style={styles.stat}>
                  <Eye size={20} style={{ color: '#94a3b8', marginBottom: '4px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{thread.viewCount}</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>views</span>
                </div>
              </Link>
            ))
          )}
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '0.5rem', 
            marginTop: '2rem' 
          }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                style={{
                  padding: '8px 12px',
                  background: page === pageNum ? '#FF8200' : 'transparent',
                  color: page === pageNum ? 'white' : '#FBDB65',
                  border: `1px solid ${page === pageNum ? '#FF8200' : 'rgba(255, 130, 0, 0.3)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: page === pageNum ? 'bold' : 'normal'
                }}
              >
                {pageNum}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}