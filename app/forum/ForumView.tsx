'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../components/Navigation';
import { Plus, TrendingUp, Clock, Pin, Lock, Eye, MessageCircle, Users, MessageSquare } from 'lucide-react';
import { forumStyles, forumColors } from './styles/forumStyles';
import CategorySection from './components/CategorySection';

interface Board {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  accessLevel: string;
  threadCount: number;
  postCount: number;
  lastPost?: {
    threadTitle: string;
    threadSlug: string;
    authorName: string;
    createdAt: string;
  } | null;
  userCanAccess: boolean;
}

interface Category {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  boards: Board[];
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
  board?: {
    slug: string;
    name: string;
  };
}

interface ForumStats {
  threadCount: number;
  postCount: number;
  userCount: number;
}

export default function ForumView() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularThreads, setPopularThreads] = useState<MessageThread[]>([]);
  const [recentThreads, setRecentThreads] = useState<MessageThread[]>([]);
  const [stats, setStats] = useState<ForumStats>({ threadCount: 0, postCount: 0, userCount: 0 });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchForumData();
  }, []);

  const fetchForumData = async () => {
    try {
      const [boardsRes, popularRes, recentRes] = await Promise.all([
        fetch('/api/forum/boards'),
        fetch('/api/forum/threads/popular'),
        fetch('/api/forum/threads/recent'),
      ]);

      const [boardsData, popularData, recentData] = await Promise.all([
        boardsRes.json(),
        popularRes.json(),
        recentRes.json(),
      ]);

      setCategories(boardsData.categories || []);
      setPopularThreads(popularData);
      setRecentThreads(recentData);

      // Calculate stats from categories
      let threadCount = 0;
      let postCount = 0;
      (boardsData.categories || []).forEach((cat: Category) => {
        cat.boards.forEach((board) => {
          threadCount += board.threadCount;
          postCount += board.postCount;
        });
      });
      setStats({ threadCount, postCount, userCount: 42 }); // userCount placeholder
    } catch (error) {
      console.error('Error fetching forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={forumStyles.container}>
        <Navigation />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <p style={{ color: forumColors.textSecondary }}>Loading forum...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={forumStyles.container}>
      <Navigation />

      {/* Header - Cleaner, less chaotic */}
      <section
        style={{
          background: `linear-gradient(135deg, ${forumColors.bgCard} 0%, ${forumColors.bgPage} 70%, ${forumColors.accentOrangeGlow} 100%)`,
          borderBottom: `3px solid ${forumColors.borderAccent}`,
          marginBottom: '32px',
          padding: '48px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          {/* Chaos Badge - ONE pop of orange */}
          <div
            style={{
              display: 'inline-block',
              background: forumColors.accentOrange,
              color: '#000',
              padding: '6px 16px',
              borderRadius: '50px',
              fontWeight: '700',
              marginBottom: '16px',
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Community Forum
          </div>

          <h1
            style={{
              fontSize: '3rem',
              fontWeight: '800',
              color: forumColors.textTitle,
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}
          >
            Full Uproar Forums
          </h1>

          <p
            style={{
              fontSize: '1.1rem',
              color: forumColors.textSecondary,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Discuss strategies, share stories, and connect with fellow chaos agents
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        {/* Action Bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '16px' : '0',
            marginBottom: '24px',
          }}
        >
          {/* Stats */}
          <div style={{ display: 'flex', gap: isMobile ? '16px' : '24px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: forumColors.textSecondary, fontSize: isMobile ? '14px' : '16px' }}>
              <MessageSquare size={isMobile ? 16 : 18} />
              <span>{stats.threadCount} threads</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: forumColors.textSecondary, fontSize: isMobile ? '14px' : '16px' }}>
              <MessageCircle size={isMobile ? 16 : 18} />
              <span>{stats.postCount} posts</span>
            </div>
          </div>

          {/* New Thread Button */}
          <button
            onClick={() => router.push('/forum/new-thread')}
            style={{ ...forumStyles.primaryButton, width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
          >
            <Plus size={18} />
            New Thread
          </button>
        </div>

        {/* Categories with Boards */}
        <div style={{ marginBottom: '48px' }}>
          {categories.map((category) => (
            <CategorySection key={category.id} category={category} boards={category.boards} />
          ))}

          {categories.length === 0 && (
            <div style={forumStyles.emptyState}>
              <MessageSquare size={48} style={{ color: forumColors.textMuted, marginBottom: '16px' }} />
              <p>No forum categories yet. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Popular & Recent Threads */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '24px' : '32px', marginBottom: '48px' }}>
          {/* Popular Threads */}
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: forumColors.textTitle,
              }}
            >
              <TrendingUp size={20} style={{ color: forumColors.accentOrange }} />
              Popular Threads
            </h2>
            <div
              style={{
                background: forumColors.bgCard,
                borderRadius: '12px',
                border: `1px solid ${forumColors.borderDefault}`,
                overflow: 'hidden',
              }}
            >
              {popularThreads.length > 0 ? (
                popularThreads.map((thread, index) => (
                  <ThreadRow key={thread.id} thread={thread} isLast={index === popularThreads.length - 1} />
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: forumColors.textMuted }}>
                  No popular threads yet
                </div>
              )}
            </div>
          </div>

          {/* Recent Threads */}
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '700',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: forumColors.textTitle,
              }}
            >
              <Clock size={20} style={{ color: '#3b82f6' }} />
              Recent Threads
            </h2>
            <div
              style={{
                background: forumColors.bgCard,
                borderRadius: '12px',
                border: `1px solid ${forumColors.borderDefault}`,
                overflow: 'hidden',
              }}
            >
              {recentThreads.length > 0 ? (
                recentThreads.map((thread, index) => (
                  <ThreadRow key={thread.id} thread={thread} isLast={index === recentThreads.length - 1} />
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: forumColors.textMuted }}>
                  No recent threads yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Thread Row Component
function ThreadRow({ thread, isLast }: { thread: MessageThread; isLast?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/forum/${thread.board?.slug || 'general'}/${thread.slug}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        background: isHovered ? forumColors.bgCardHover : 'transparent',
        borderBottom: isLast ? 'none' : `1px solid ${forumColors.borderSubtle}`,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background 0.15s',
        borderLeft: isHovered ? `3px solid ${forumColors.accentOrange}` : '3px solid transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}
        >
          {thread.isPinned && (
            <span style={forumStyles.pinnedBadge}>
              <Pin size={10} style={{ marginRight: '2px' }} /> Pinned
            </span>
          )}
          {thread.isLocked && (
            <span style={forumStyles.lockedBadge}>
              <Lock size={10} style={{ marginRight: '2px' }} /> Locked
            </span>
          )}
          <span
            style={{
              fontWeight: '600',
              color: forumColors.textTitle,
              fontSize: '14px',
            }}
          >
            {thread.title.length > 50 ? thread.title.slice(0, 50) + '...' : thread.title}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: forumColors.textSecondary }}>
          by {thread.authorName}
          {thread.board && (
            <>
              {' '}
              in <span style={{ color: forumColors.accentOrangeText }}>{thread.board.name}</span>
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', color: forumColors.textMuted, fontSize: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Eye size={14} />
          {thread.viewCount}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MessageCircle size={14} />
          {thread.postCount}
        </span>
      </div>
    </Link>
  );
}
