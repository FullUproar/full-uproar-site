'use client';

import { Lock, Users, Crown, Globe } from 'lucide-react';
import { forumStyles, getAccessBadgeStyle, getAccessBadgeText } from '../styles/forumStyles';

interface AccessBadgeProps {
  accessLevel: string;
  showIcon?: boolean;
}

export default function AccessBadge({ accessLevel, showIcon = true }: AccessBadgeProps) {
  const style = getAccessBadgeStyle(accessLevel);
  const text = getAccessBadgeText(accessLevel);

  // No badge for public boards
  if (!style || !text) return null;

  const icons: Record<string, React.ReactNode> = {
    MEMBERS_ONLY: <Users size={10} />,
    SUBSCRIBERS_ONLY: <Crown size={10} />,
    PRIVATE: <Lock size={10} />,
  };

  return (
    <span style={{ ...style, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {showIcon && icons[accessLevel]}
      {text}
    </span>
  );
}
