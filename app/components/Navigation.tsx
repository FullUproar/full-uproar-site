'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ShoppingCart, Package, User, Settings, Gamepad2, ChevronDown, Wand2 } from 'lucide-react';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import FuglyLogo from './FuglyLogo';
import CartButton from './CartButton';
import MobileCartButton from './MobileCartButton';

interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

export default function Navigation() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [expandedMobileSection, setExpandedMobileSection] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  const navLinks: NavItem[] = [
    {
      href: '/shop',
      label: 'SHOP',
      children: [
        { href: '/shop/games', label: 'All Games' },
        { href: '/shop/specials', label: 'Specials' },
        { href: '/shop/merch', label: 'Merch' },
      ]
    },
    {
      href: '/discover',
      label: 'DISCOVER',
      children: [
        { href: '/discover/games', label: 'Games' },
        { href: '/discover/fugly', label: 'Fugly' },
        { href: '/discover/about', label: 'About Us' },
        { href: '/discover/the-line', label: 'The Line' },
        { href: '/discover/faq', label: 'FAQ' },
        { href: '/discover/afterroar', label: 'What is Afterroar?' },
      ]
    },
    {
      href: '/connect',
      label: 'CONNECT',
      children: [
        { href: '/connect/forum', label: 'Forum' },
        { href: '/connect/contact', label: 'Contact Us' },
      ]
    },
    {
      href: '/game-nights',
      label: 'PLAY',
      children: [
        { href: '/game-nights', label: 'My Game Nights' },
        { href: '/play-online', label: 'Play Online' },
        { href: '/game-kit', label: '✨ Game Kit' },
      ]
    },
  ];

  const styles = {
    nav: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100, // High z-index to stay above accelerated scroll content
      backdropFilter: 'blur(12px)',
      background: 'rgba(17, 24, 39, 0.95)', // Slightly more opaque
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      borderBottom: '4px solid #FF8200'
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
      height: isMobile ? '3.5rem' : '4rem'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    logoText: {
      fontWeight: 900,
      fontSize: isMobile ? '1.25rem' : '1.5rem',
      color: '#FF8200'
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
      borderBottomColor: '#FF8200'
    },
    navItemWrapper: {
      position: 'relative' as const,
    },
    navLinkWithDropdown: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontWeight: 'bold',
      color: '#fde68a',
      textDecoration: 'none',
      transition: 'color 0.3s',
      paddingBottom: '0.25rem',
      borderBottom: '2px solid transparent',
      cursor: 'pointer',
    },
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '0.5rem',
      background: 'rgba(17, 24, 39, 0.98)',
      borderRadius: '0.75rem',
      border: '2px solid #FF8200',
      padding: '0.5rem',
      minWidth: '180px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      zIndex: 110,
    },
    dropdownItem: {
      display: 'block',
      padding: '0.625rem 1rem',
      color: '#fde68a',
      textDecoration: 'none',
      borderRadius: '0.5rem',
      transition: 'all 0.2s',
      fontSize: '0.9rem',
    },
    dropdownItemHover: {
      background: 'rgba(249, 115, 22, 0.15)',
      color: '#FF8200',
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
                  <div
                    key={link.href}
                    style={styles.navItemWrapper}
                    onMouseEnter={() => link.children && handleMouseEnter(link.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {link.children ? (
                      <>
                        <Link
                          href={link.href}
                          style={{
                            ...styles.navLinkWithDropdown,
                            ...(pathname.startsWith(link.href) ? styles.activeNavLink : {})
                          }}
                        >
                          {link.label}
                          <ChevronDown
                            size={14}
                            style={{
                              transition: 'transform 0.2s',
                              transform: openDropdown === link.label ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                          />
                        </Link>
                        {openDropdown === link.label && (
                          <div style={styles.dropdown}>
                            {link.children.map((child) => (
                              <Link
                                key={child.href}
                                href={child.href}
                                style={{
                                  ...styles.dropdownItem,
                                  ...(pathname === child.href ? { color: '#FF8200', background: 'rgba(249, 115, 22, 0.1)' } : {})
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)';
                                  e.currentTarget.style.color = '#FF8200';
                                }}
                                onMouseLeave={(e) => {
                                  if (pathname !== child.href) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#fde68a';
                                  }
                                }}
                                onClick={() => setOpenDropdown(null)}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={link.href}
                        style={{
                          ...styles.navLink,
                          ...(pathname === link.href ? styles.activeNavLink : {})
                        }}
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                ))}
                
                <SignedOut>
                  <Link href="/sign-in">
                    <button style={{
                      background: '#FF8200',
                      color: '#111827',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontWeight: 'bold',
                      border: 'none',
                      cursor: 'pointer'
                    }}>
                      SIGN IN
                    </button>
                  </Link>
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
                        colorPrimary: "#FF8200",
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
                        label="Game Kit"
                        labelIcon={<Wand2 size={16} />}
                        href="/game-kit"
                      />
                      <UserButton.Link
                        label="Game Nights"
                        labelIcon={<Gamepad2 size={16} />}
                        href="/game-nights"
                      />
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
                    </UserButton.MenuItems>
                  </UserButton>
                </SignedIn>
                
                <CartButton />
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
                  color: '#FF8200'
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
          bottom: 0,
          background: 'rgba(17, 24, 39, 0.98)',
          borderBottom: '4px solid #FF8200',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          zIndex: 100,
          backdropFilter: 'blur(12px)',
          overflowY: 'auto'
        }}>
          {navLinks.map((link) => (
            <div key={link.href}>
              {link.children ? (
                <>
                  <button
                    onClick={() => setExpandedMobileSection(
                      expandedMobileSection === link.label ? null : link.label
                    )}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0.5rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: pathname.startsWith(link.href) ? '#FF8200' : '#fde68a',
                      fontSize: '1rem',
                    }}
                  >
                    {link.label}
                    <ChevronDown
                      size={18}
                      style={{
                        transition: 'transform 0.2s',
                        transform: expandedMobileSection === link.label ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                    />
                  </button>
                  {expandedMobileSection === link.label && (
                    <div style={{
                      paddingLeft: '1rem',
                      paddingBottom: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}>
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          style={{
                            display: 'block',
                            padding: '0.5rem 0.75rem',
                            color: pathname === child.href ? '#FF8200' : '#94a3b8',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            borderRadius: '0.5rem',
                            background: pathname === child.href ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                          }}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={link.href}
                  style={{
                    ...styles.navLink,
                    display: 'block',
                    padding: '0.75rem 0.5rem',
                    ...(pathname === link.href ? { color: '#FF8200' } : {})
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '0.5rem 0' }} />

          <SignedOut>
            <Link href="/sign-in" style={{ width: '100%' }} onClick={() => setIsMenuOpen(false)}>
              <button style={{
                background: '#FF8200',
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
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/game-kit"
              style={{ ...styles.navLink, display: 'flex', alignItems: 'center', padding: '0.5rem', gap: '8px' }}
              onClick={() => setIsMenuOpen(false)}
            >
              <Wand2 size={20} />
              GAME KIT
            </Link>
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
          
          <MobileCartButton onClose={() => setIsMenuOpen(false)} />
        </div>
      )}
    </>
  );
}