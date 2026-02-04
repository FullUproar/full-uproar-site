import Link from 'next/link';
import Navigation from '@/app/components/Navigation';

export default function PrivacyPolicy() {
  return (
    <>
      <Navigation />
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a',
        paddingTop: '80px'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem',
          color: '#e2e8f0'
        }}>
          <h1 style={{ 
            color: '#FF8200', 
            fontSize: '2.5rem', 
            marginBottom: '2rem',
            fontWeight: 'bold'
          }}>
            Privacy Policy
          </h1>
          
          <div style={{ 
            backgroundColor: '#1f2937',
            padding: '2rem',
            borderRadius: '8px',
            border: '2px solid #FF8200'
          }}>
            <p style={{ marginBottom: '1rem', color: '#FBDB65' }}>
              <strong>Last Updated: January 2025</strong>
            </p>

            <h2 style={{ color: '#FF8200', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Information We Collect
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We collect information you provide directly to us, such as when you create an account, 
              make a purchase, or contact us for support. This includes your name, email address, 
              shipping address, and payment information.
            </p>

            <h2 style={{ color: '#FF8200', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              How We Use Your Information
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We use the information we collect to process orders, communicate with you, 
              improve our services, and comply with legal obligations.
            </p>

            <h2 style={{ color: '#FF8200', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Data Security
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 style={{ color: '#FF8200', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Third-Party Services
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We use trusted third-party services including Stripe for payment processing and 
              Clerk for authentication. These services have their own privacy policies.
            </p>

            <h2 style={{ color: '#FF8200', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Contact Us
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@fulluproar.com" style={{ color: '#FF8200' }}>
                privacy@fulluproar.com
              </a>
            </p>
          </div>

          {/* Navigation Section */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'rgba(255, 130, 0, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 130, 0, 0.3)',
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Link
                href="/"
                style={{
                  color: '#FF8200',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #FF8200',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                ← Back to Home
              </Link>
              <Link
                href="/terms"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  transition: 'color 0.2s'
                }}
              >
                Terms of Service
              </Link>
              <Link
                href="/returns"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  transition: 'color 0.2s'
                }}
              >
                Returns Policy
              </Link>
              <Link
                href="/discover/faq"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  transition: 'color 0.2s'
                }}
              >
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}