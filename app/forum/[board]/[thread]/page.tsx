'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';
import { 
  ArrowLeft, MessageCircle, Lock, Pin, User, Calendar,
  Edit, Trash2, Shield, Send, AlertCircle
} from 'lucide-react';

interface Thread {
  id: number;
  title: string;
  slug: string;
  authorId: string;
  authorName: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  createdAt: string;
  board: {
    name: string;
    slug: string;
  };
}

interface Post {
  id: number;
  content: string;
  authorId: string;
  author: {
    displayName?: string;
    username?: string;
    trustLevel: number;
    isBanned: boolean;
    role: string;
  };
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
}

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { userId, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();
  
  const boardSlug = params.board as string;
  const threadSlug = params.thread as string;
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchThreadAndPosts();
  }, [boardSlug, threadSlug]);

  const fetchThreadAndPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch thread info
      const threadRes = await fetch(`/api/forum/threads/${boardSlug}/${threadSlug}`);
      if (!threadRes.ok) {
        router.push('/forum');
        return;
      }
      
      const threadData = await threadRes.json();
      setThread(threadData);
      
      // Fetch posts
      const postsRes = await fetch(`/api/forum/threads/${threadData.id}/posts`);
      const postsData = await postsRes.json();
      setPosts(postsData);
      
      // Increment view count
      if (authLoaded) {
        fetch(`/api/forum/threads/${threadData.id}/view`, { method: 'POST' });
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
      router.push('/forum');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !thread) {
      setError('You must be logged in to reply');
      return;
    }
    
    if (!replyContent.trim()) {
      setError('Please enter a reply');
      return;
    }
    
    setReplying(true);
    setError('');
    
    try {
      const response = await fetch(`/api/forum/threads/${thread.id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim()
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post reply');
      }
      
      // Refresh posts
      setReplyContent('');
      await fetchThreadAndPosts();
    } catch (error: any) {
      setError(error.message || 'Failed to post reply');
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTrustLevelBadge = (level: number) => {
    const badges = ['New', 'Basic', 'Member', 'Regular', 'Leader'];
    const colors = ['#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    
    return {
      name: badges[level] || 'New',
      color: colors[level] || '#6b7280'
    };
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      color: '#e2e8f0'
    },
    content: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '2rem'
    },
    threadHeader: {
      background: 'rgba(30, 41, 59, 0.95)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      backdropFilter: 'blur(10px)'
    },
    post: {
      background: 'rgba(30, 41, 59, 0.95)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1rem',
      backdropFilter: 'blur(10px)'
    },
    postAuthor: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1rem',
      paddingBottom: '1rem',
      borderBottom: '1px solid rgba(249, 115, 22, 0.2)'
    },
    avatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      color: 'white'
    },
    replyBox: {
      background: 'rgba(30, 41, 59, 0.95)',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '2rem',
      backdropFilter: 'blur(10px)'
    },
    textarea: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid rgba(249, 115, 22, 0.3)',
      background: 'rgba(17, 24, 39, 0.8)',
      color: '#f3f4f6',
      fontSize: '16px',
      outline: 'none',
      transition: 'all 0.2s',
      resize: 'vertical' as const,
      minHeight: '120px',
      fontFamily: 'inherit'
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
          <p style={{ color: '#fdba74' }}>Loading thread...</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return null;
  }

  return (
    <div style={styles.container}>
      <Navigation />
      
      <div style={styles.content}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <Link href="/forum" style={{ color: '#fdba74', textDecoration: 'none' }}>
            Forum
          </Link>
          <span style={{ color: '#64748b' }}>/</span>
          <Link href={`/forum/${thread.board.slug}`} style={{ color: '#fdba74', textDecoration: 'none' }}>
            {thread.board.name}
          </Link>
          <span style={{ color: '#64748b' }}>/</span>
          <span style={{ color: '#94a3b8' }}>{thread.title}</span>
        </div>

        {/* Thread Header */}
        <div style={styles.threadHeader}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '1rem' }}>
            {thread.isPinned && <Pin size={24} style={{ color: '#f97316' }} />}
            {thread.isLocked && <Lock size={24} style={{ color: '#ef4444' }} />}
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f97316', flex: 1 }}>
              {thread.title}
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', fontSize: '14px', color: '#94a3b8' }}>
            <span>Started by {thread.authorName}</span>
            <span>{formatDate(thread.createdAt)}</span>
            <span>{thread.viewCount} views</span>
            <span>{posts.length} replies</span>
          </div>
        </div>

        {/* Posts */}
        {posts.map((post, index) => (
          <div key={post.id} style={styles.post}>
            <div style={styles.postAuthor}>
              <div style={styles.avatar}>
                {(post.author.displayName || post.author.username || 'A')[0].toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {post.author.displayName || post.author.username || 'Anonymous'}
                  </span>
                  
                  {post.author.role === 'ADMIN' && (
                    <span style={{
                      background: '#dc2626',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      <Shield size={12} style={{ display: 'inline', marginRight: '2px' }} />
                      ADMIN
                    </span>
                  )}
                  
                  {post.author.isBanned && (
                    <span style={{
                      background: '#7c3aed',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      BANNED
                    </span>
                  )}
                  
                  <span style={{
                    background: getTrustLevelBadge(post.author.trustLevel).color,
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {getTrustLevelBadge(post.author.trustLevel).name}
                  </span>
                </div>
                
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                  <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  {formatDate(post.createdAt)}
                  {post.isEdited && (
                    <span style={{ marginLeft: '8px' }}>
                      <Edit size={12} style={{ display: 'inline', marginRight: '2px' }} />
                      edited {post.editedAt ? formatDate(post.editedAt) : ''}
                    </span>
                  )}
                </div>
              </div>
              
              {index === 0 && (
                <span style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  color: '#f97316',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  Original Post
                </span>
              )}
            </div>
            
            <div style={{ 
              fontSize: '16px', 
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {post.content}
            </div>
          </div>
        ))}

        {/* Reply Box */}
        {thread.isLocked ? (
          <div style={{
            ...styles.replyBox,
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <Lock size={24} style={{ marginBottom: '8px' }} />
            <p>This thread is locked. No new replies can be posted.</p>
          </div>
        ) : userId ? (
          <div style={styles.replyBox}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '1rem' }}>
              Post a Reply
            </h3>
            
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={20} />
                {error}
              </div>
            )}
            
            <form onSubmit={handleReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                style={styles.textarea}
                placeholder="Share your thoughts..."
                disabled={replying}
              />
              
              <button
                type="submit"
                style={{
                  marginTop: '1rem',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: replying ? 'not-allowed' : 'pointer',
                  opacity: replying ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                disabled={replying}
              >
                <Send size={20} />
                {replying ? 'Posting...' : 'Post Reply'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{
            ...styles.replyBox,
            textAlign: 'center'
          }}>
            <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
              You must be signed in to reply to this thread.
            </p>
            <Link 
              href="/sign-in" 
              style={{
                color: '#f97316',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              Sign in to reply
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}