'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, Settings, Package, Gamepad2, Wand2, LogOut, Shield } from 'lucide-react';

interface UserDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?';

  const menuItems = [
    { href: '/game-kit', label: 'Game Kit', icon: <Wand2 size={16} /> },
    { href: '/game-nights', label: 'Game Nights', icon: <Gamepad2 size={16} /> },
    { href: '/account', label: 'Account Settings', icon: <Settings size={16} /> },
    { href: '/profile', label: 'My Profile', icon: <User size={16} /> },
    { href: '/track-order', label: 'Track Orders', icon: <Package size={16} /> },
    { href: '/admin', label: 'Admin Dashboard', icon: <Shield size={16} /> },
  ];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          border: '2px solid #FF8200',
          background: user.image ? `url(${user.image}) center/cover` : '#1f2937',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FF8200',
          fontWeight: 700,
          fontSize: '0.875rem',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {!user.image && initials}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'rgba(17, 24, 39, 0.98)',
          borderRadius: '0.75rem',
          border: '2px solid #FF8200',
          padding: '0.5rem',
          minWidth: '220px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          zIndex: 110,
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '0.25rem',
          }}>
            <div style={{ color: '#FF8200', fontWeight: 700, fontSize: '0.9rem' }}>
              {user.name || 'User'}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.125rem' }}>
              {user.email}
            </div>
          </div>

          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1rem',
                color: '#FBDB65',
                textDecoration: 'none',
                borderRadius: '0.5rem',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 130, 0, 0.15)';
                e.currentTarget.style.color = '#FF8200';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#FBDB65';
              }}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: '0.25rem',
            paddingTop: '0.25rem',
          }}>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1rem',
                color: '#ef4444',
                background: 'transparent',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                width: '100%',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
