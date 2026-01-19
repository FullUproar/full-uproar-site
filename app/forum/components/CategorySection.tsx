'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { forumStyles, forumColors } from '../styles/forumStyles';
import BoardCard from './BoardCard';

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
    authorName: string;
    createdAt: string | Date;
  } | null;
  userCanAccess: boolean;
}

interface CategorySectionProps {
  category: {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
    icon?: string | null;
  };
  boards: Board[];
  defaultCollapsed?: boolean;
}

export default function CategorySection({
  category,
  boards,
  defaultCollapsed = false,
}: CategorySectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div style={forumStyles.categorySection}>
      {/* Category Header */}
      <div
        style={{
          ...forumStyles.categoryHeader,
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span style={forumStyles.categoryIcon}>{category.icon || '📁'}</span>
        <span style={forumStyles.categoryName}>{category.name}</span>
        {category.description && (
          <span style={forumStyles.categoryDescription}>{category.description}</span>
        )}
        <div style={{ marginLeft: 'auto', color: forumColors.textMuted }}>
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      {/* Boards */}
      {!isCollapsed && (
        <div>
          {boards.map((board, index) => (
            <BoardCard
              key={board.id}
              board={board}
              threadCount={board.threadCount}
              postCount={board.postCount}
              lastPost={board.lastPost}
              isLast={index === boards.length - 1}
              userCanAccess={board.userCanAccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}
