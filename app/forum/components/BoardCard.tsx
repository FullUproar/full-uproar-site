'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Users, Lock } from 'lucide-react';
import { forumStyles, forumColors } from '../styles/forumStyles';
import AccessBadge from './AccessBadge';
import { formatDistanceToNow } from 'date-fns';

interface BoardCardProps {
  board: {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    accessLevel: string;
  };
  threadCount: number;
  postCount: number;
  lastPost?: {
    threadTitle: string;
    authorName: string;
    createdAt: string | Date;
  } | null;
  isLast?: boolean;
  userCanAccess?: boolean;
}

export default function BoardCard({
  board,
  threadCount,
  postCount,
  lastPost,
  isLast = false,
  userCanAccess = true,
}: BoardCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    ...forumStyles.boardCard,
    ...(isHovered ? forumStyles.boardCardHover : {}),
    ...(isLast ? forumStyles.boardCardLast : {}),
    ...(!userCanAccess ? { opacity: 0.6 } : {}),
  };

  const content = (
    <div
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Board Icon */}
      <div style={forumStyles.boardIcon}>
        {board.icon || '💬'}
      </div>

      {/* Board Info */}
      <div style={forumStyles.boardInfo}>
        <div style={forumStyles.boardName}>
          {board.name}
          <AccessBadge accessLevel={board.accessLevel} />
          {!userCanAccess && <Lock size={14} style={{ color: forumColors.textMuted }} />}
        </div>
        {board.description && (
          <div style={forumStyles.boardDescription}>{board.description}</div>
        )}
      </div>

      {/* Stats */}
      <div style={forumStyles.boardStats}>
        <div style={forumStyles.boardStatItem}>
          <span style={forumStyles.boardStatValue}>{threadCount}</span>
          <span style={forumStyles.boardStatLabel}>Threads</span>
        </div>
        <div style={forumStyles.boardStatItem}>
          <span style={forumStyles.boardStatValue}>{postCount}</span>
          <span style={forumStyles.boardStatLabel}>Posts</span>
        </div>
      </div>

      {/* Last Post */}
      {lastPost && (
        <div style={forumStyles.boardLastPost}>
          <div style={{ fontSize: '13px', color: forumColors.textSecondary, marginBottom: '2px' }}>
            {lastPost.threadTitle.length > 30
              ? lastPost.threadTitle.slice(0, 30) + '...'
              : lastPost.threadTitle}
          </div>
          <div style={{ fontSize: '11px', color: forumColors.textMuted }}>
            by {lastPost.authorName} &bull;{' '}
            {formatDistanceToNow(new Date(lastPost.createdAt), { addSuffix: true })}
          </div>
        </div>
      )}
    </div>
  );

  if (!userCanAccess) {
    return content;
  }

  return (
    <Link href={`/forum/${board.slug}`} style={{ textDecoration: 'none' }}>
      {content}
    </Link>
  );
}
