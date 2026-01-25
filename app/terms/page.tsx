import Link from 'next/link';
import Navigation from '@/app/components/Navigation';

export default function TermsOfService() {
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
            color: '#f97316', 
            fontSize: '2.5rem', 
            marginBottom: '2rem',
            fontWeight: 'bold'
          }}>
            Terms of Service
          </h1>
          
          <div style={{ 
            backgroundColor: '#1f2937',
            padding: '2rem',
            borderRadius: '8px',
            border: '2px solid #f97316'
          }}>
            <p style={{ marginBottom: '1rem', color: '#fdba74' }}>
              <strong>Last Updated: January 2025</strong>
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Acceptance of Terms
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              By accessing and using this website, you accept and agree to be bound by the terms 
              and provision of this agreement.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Use License
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              Permission is granted to temporarily view and purchase products from Full Uproar 
              for personal, non-commercial transitory viewing only.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Product Purchases
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              All purchases are subject to product availability. Prices are subject to change 
              without notice. We reserve the right to refuse any order you place with us.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              User Accounts
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Prohibited Uses
            </h2>
            <ul style={{ marginBottom: '1rem', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
              <li>Using the site for any unlawful purpose</li>
              <li>Attempting to gain unauthorized access to any portion of the site</li>
              <li>Interfering with the proper working of the site</li>
              <li>Using any robot, spider, or other automatic device to access the site</li>
            </ul>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Limitation of Liability
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              Full Uproar Games Inc. shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages resulting from your use of the site or products.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Contact Information
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              For questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@fulluproar.com" style={{ color: '#f97316' }}>
                legal@fulluproar.com
              </a>
            </p>
          </div>

          {/* Navigation Section */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'rgba(249, 115, 22, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(249, 115, 22, 0.3)',
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
                  color: '#f97316',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #f97316',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
              >
                ← Back to Home
              </Link>
              <Link
                href="/privacy"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  transition: 'color 0.2s'
                }}
              >
                Privacy Policy
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