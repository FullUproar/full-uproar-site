import Navigation from '@/app/components/Navigation';

export default function ReturnsPolicy() {
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
            Returns & Refunds Policy
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
              30-Day Return Policy
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              We want you to be completely satisfied with your purchase. If you're not happy with 
              your order, you may return most items within 30 days of delivery for a full refund.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Eligible Items
            </h2>
            <ul style={{ marginBottom: '1rem', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
              <li>Board games in unopened, original packaging</li>
              <li>Merchandise in new, unworn condition with tags</li>
              <li>Accessories in original packaging</li>
            </ul>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Non-Returnable Items
            </h2>
            <ul style={{ marginBottom: '1rem', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
              <li>Digital downloads</li>
              <li>Opened board games</li>
              <li>Custom or personalized items</li>
              <li>Items marked as final sale</li>
            </ul>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              How to Return
            </h2>
            <ol style={{ marginBottom: '1rem', lineHeight: '1.6', paddingLeft: '1.5rem' }}>
              <li>Contact our support team at returns@fulluproar.com</li>
              <li>Provide your order number and reason for return</li>
              <li>We'll send you a return authorization and shipping label</li>
              <li>Pack items securely in original packaging</li>
              <li>Drop off at any authorized shipping location</li>
            </ol>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Refund Processing
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              Once we receive your return, we'll inspect the items and process your refund within 
              5-7 business days. Refunds will be issued to your original payment method.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Damaged or Defective Items
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              If you receive a damaged or defective item, please contact us immediately with photos 
              of the damage. We'll arrange for a replacement or full refund including shipping costs.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              International Returns
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              International customers are responsible for return shipping costs unless the item 
              was damaged or defective. Please allow additional time for processing.
            </p>

            <h2 style={{ color: '#f97316', fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem' }}>
              Contact Us
            </h2>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
              For questions about returns or refunds, please contact us at{' '}
              <a href="mailto:returns@fulluproar.com" style={{ color: '#f97316' }}>
                returns@fulluproar.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}