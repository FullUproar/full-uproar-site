'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ShoppingCart, Package, User, Settings } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import { useCartStore } from '@/lib/cartStore';
import FuglyLogo from './FuglyLogo';

export default function Navigation() {
  const pathname = usePathname();
  const { getTotalItems, toggleCart } = useCartStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navLinks = [
    { href: '/', label: 'HOME' },
    { href: '/games', label: 'GAMES' },
    { href: '/merch', label: 'MERCH' },
    { href: '/comics', label: 'COMICS' },
    { href: '/forum', label: 'FORUM' },
    { href: '/chaos', label: 'CHAOS' },
    { href: '/cult', label: 'CULT' },
  ];

  const styles = {
    nav: {
      position: 'sticky' as const,
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(12px)',
      background: 'rgba(17, 24, 39, 0.9)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #f97316'
    },
    navContainer: {
      maxWidth: '80rem',
      margin: '0 auto',
      padding: '0 1rem'
    },
    navFlex: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: isMobile ? '3.5rem' : '4rem',
      overflow: 'hidden'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoText: {
      fontWeight: 900,
      fontSize: isMobile ? '1.25rem' : '1.5rem',
      color: '#f97316'
    },
    logoSubtext: {
      fontSize: isMobile ? '0.625rem' : '0.75rem',
      color: '#fdba74',
      marginTop: '-0.25rem'
    },
    navLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: '2rem'
    },
    navLink: {
      fontWeight: 'bold',
      color: '#fde68a',
      textDecoration: 'none',
      transition: 'color 0.3s',
      paddingBottom: '0.25rem',
      borderBottom: '2px solid transparent'
    },
    activeNavLink: {
      borderBottomColor: '#f97316'
    },
    cartButton: {
      position: 'relative' as const,
      padding: '0.5rem',
      borderRadius: '50%',
      transition: 'background-color 0.3s',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer'
    }
  };

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <div style={styles.navFlex}>
            <Link href="/" style={{ ...styles.logo, textDecoration: 'none' }}>
              <FuglyLogo size={isMobile ? 50 : 75} />
              <div>
                <span style={styles.logoText}>FULL UPROAR</span>
                <div style={styles.logoSubtext}>Fugly Approved Games™</div>
              </div>
            </Link>
            
            {/* Desktop nav links */}
            {!isMobile && (
              <div style={styles.navLinks}>
                {navLinks.map((link) => (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    style={{
                      ...styles.navLink,
                      ...(pathname === link.href ? styles.activeNavLink : {})
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
                
                <SignedOut>
                  <SignInButton mode="modal">
                    <button style={{
                      background: '#f97316',
                      color: '#111827',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: 'pointer'
                    }}>
                      SIGN IN
                    </button>
                  </SignInButton>
                </SignedOut>
                
                <SignedIn>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 border-2 border-orange-500",
                        userButtonPopoverCard: "bg-gray-900 border-2 border-orange-500",
                        userButtonPopoverActionButton: "text-orange-400 hover:text-orange-300 hover:bg-orange-500/20",
                        userButtonPopoverActionButtonText: "text-orange-400",
                        userButtonPopoverActionButtonIcon: "text-orange-400",
                        userButtonPopoverFooter: "hidden",
                        userPreviewMainIdentifier: "text-orange-400 font-bold",
                        userPreviewSecondaryIdentifier: "text-gray-400",
                        userButtonTrigger: "hover:opacity-80",
                        userButtonBox: "shadow-xl",
                        userButtonOuterIdentifier: "text-orange-400",
                        userButtonPopoverMain: "bg-gray-900",
                        userButtonPopoverActions: "bg-gray-900",
                        userPreviewTextContainer: "text-orange-400",
                        userButtonPopoverActionButtonTextContainer: "text-orange-400",
                        accordionTriggerButton: "text-orange-400 hover:text-orange-300",
                      },
                      variables: {
                        colorPrimary: "#f97316",
                        colorText: "#fdba74",
                        colorTextOnPrimaryBackground: "#111827",
                        colorTextSecondary: "#94a3b8",
                        colorBackground: "#111827",
                        colorInputBackground: "#1f2937",
                        colorInputText: "#fdba74",
                        borderRadius: "0.5rem"
                      }
                    }}
                  >
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Account Settings"
                        labelIcon={<Settings size={16} />}
                        href="/account"
                      />
                      <UserButton.Link
                        label="My Profile"
                        labelIcon={<User size={16} />}
                        href="/profile"
                      />
                      <UserButton.Link
                        label="Track Orders"
                        labelIcon={<Package size={16} />}
                        href="/track-order"
                      />
                      <UserButton.Link
                        label="Admin Dashboard"
                        labelIcon={<Package size={16} />}
                        href="/admin"
                      />
                      <UserButton.Action
                        label="Manage account"
                        open="/account"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </SignedIn>
                
                <button onClick={toggleCart} style={styles.cartButton}>
                  <ShoppingCart style={{ height: '1.25rem', width: '1.25rem', color: '#fdba74' }} />
                  {getTotalItems() > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-0.25rem',
                      right: '-0.25rem',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '0.75rem',
                      borderRadius: '50%',
                      height: '1.25rem',
                      width: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}>
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            {isMobile && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: '#f97316'
                }}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {isMobile && isMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '3.5rem',
          left: 0,
          right: 0,
          background: 'rgba(17, 24, 39, 0.95)',
          borderBottom: '4px solid #f97316',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          zIndex: 50,
          backdropFilter: 'blur(12px)'
        }}>
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              style={{
                ...styles.navLink, 
                display: 'block', 
                padding: '0.5rem',
                ...(pathname === link.href ? { color: '#f97316' } : {})
              }} 
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          
          <SignedOut>
            <SignInButton mode="modal">
              <button style={{
                background: '#f97316',
                color: '#111827',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                width: '100%'
              }}>
                SIGN IN
              </button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <Link 
              href="/track-order" 
              style={{ ...styles.navLink, display: 'block', padding: '0.5rem' }}
              onClick={() => setIsMenuOpen(false)}
            >
              TRACK ORDERS
            </Link>
            <Link 
              href="/admin" 
              style={{ ...styles.navLink, display: 'block', padding: '0.5rem' }}
              onClick={() => setIsMenuOpen(false)}
            >
              ADMIN
            </Link>
            <Link 
              href="/account" 
              style={{ ...styles.navLink, display: 'flex', alignItems: 'center', padding: '0.5rem', gap: '8px' }}
              onClick={() => setIsMenuOpen(false)}
            >
              <User size={20} />
              MY ACCOUNT
            </Link>
          </SignedIn>
          
          <button onClick={() => { toggleCart(); setIsMenuOpen(false); }} style={{
            background: 'rgba(249, 115, 22, 0.2)',
            color: '#fdba74',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            border: '2px solid #f97316',
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <ShoppingCart size={20} />
            CART {getTotalItems() > 0 && `(${getTotalItems()})`}
          </button>
        </div>
      )}
    </>
  );
}