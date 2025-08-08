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
            color: '#f97316', 
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
            border: '2px solid #f97316'
          }}>
            <p style={{ marginBottom: '1rem', color: '#fdba74' }}>
              <strong>Last Updated: January 2025</strong>
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Information We Collect
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We collect information you provide directly to us, such as when you create an account, 
              make a purchase, or contact us for support. This includes your name, email address, 
              shipping address, and payment information.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              How We Use Your Information
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We use the information we collect to process orders, communicate with you, 
              improve our services, and comply with legal obligations.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Data Security
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Third-Party Services
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We use trusted third-party services including Stripe for payment processing and 
              Clerk for authentication. These services have their own privacy policies.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Contact Us
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@fulluproar.com" style={{ color: '#f97316' }}>
                privacy@fulluproar.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}