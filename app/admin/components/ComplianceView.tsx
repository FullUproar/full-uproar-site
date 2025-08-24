'use client';

import { useState } from 'react';
import { Shield, Check, X, AlertTriangle, ExternalLink, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface ComplianceItem {
  requirement: string;
  description: string;
  status: 'compliant' | 'partial' | 'missing';
  implementation: string;
  notes?: string;
  actions?: string[];
  sources?: { name: string; url: string }[];
}

interface ComplianceCategory {
  name: string;
  description: string;
  icon: string;
  items: ComplianceItem[];
  references: { name: string; url: string }[];
}

export default function ComplianceView() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['GDPR']));

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const complianceData: Record<string, ComplianceCategory> = {
    'GDPR': {
      name: 'GDPR (European Union)',
      description: 'General Data Protection Regulation - EU privacy law affecting any business serving EU residents',
      icon: '🇪🇺',
      items: [
        {
          requirement: 'Cookie Consent',
          description: 'Users must consent before non-essential cookies are set',
          status: 'compliant',
          implementation: 'CookieConsent.tsx component with accept/decline options',
          notes: 'Implements Google Analytics consent mode integration',
          sources: [
            { name: 'GDPR Article 7', url: 'https://gdpr-info.eu/art-7-gdpr/' }
          ]
        },
        {
          requirement: 'Privacy Policy',
          description: 'Clear information about data collection and processing',
          status: 'compliant',
          implementation: 'Privacy policy page at /privacy',
          notes: 'Should be reviewed by legal counsel for completeness',
          sources: [
            { name: 'GDPR Articles 13-14', url: 'https://gdpr-info.eu/art-13-gdpr/' }
          ]
        },
        {
          requirement: 'Right to Access',
          description: 'Users can request their personal data',
          status: 'partial',
          implementation: 'Manual process via support@fulluproar.com',
          actions: ['Create automated data export feature', 'Document the request process'],
          sources: [
            { name: 'GDPR Article 15', url: 'https://gdpr-info.eu/art-15-gdpr/' }
          ]
        },
        {
          requirement: 'Right to Deletion',
          description: 'Users can request deletion of their data',
          status: 'partial',
          implementation: 'Manual deletion through admin panel',
          actions: ['Add user self-service deletion', 'Create deletion request form'],
          sources: [
            { name: 'GDPR Article 17', url: 'https://gdpr-info.eu/art-17-gdpr/' }
          ]
        },
        {
          requirement: 'Data Breach Notification',
          description: 'Must notify authorities within 72 hours of breach',
          status: 'missing',
          implementation: 'No formal process documented',
          actions: ['Create breach response plan', 'Set up monitoring alerts', 'Document notification procedures'],
          sources: [
            { name: 'GDPR Articles 33-34', url: 'https://gdpr-info.eu/art-33-gdpr/' }
          ]
        },
        {
          requirement: 'Privacy by Design',
          description: 'Data protection built into systems from the start',
          status: 'partial',
          implementation: 'Using Clerk for auth, Stripe for payments (both compliant)',
          notes: 'Third-party services handle most sensitive data',
          sources: [
            { name: 'GDPR Article 25', url: 'https://gdpr-info.eu/art-25-gdpr/' }
          ]
        }
      ],
      references: [
        { name: 'Official GDPR Text', url: 'https://gdpr-info.eu/' },
        { name: 'EU GDPR Compliance Checklist', url: 'https://gdpr.eu/checklist/' }
      ]
    },
    'CCPA': {
      name: 'CCPA/CPRA (California)',
      description: 'California Consumer Privacy Act - Privacy rights for California residents',
      icon: '🐻',
      items: [
        {
          requirement: 'Privacy Policy with CA Disclosures',
          description: 'Specific disclosures for California residents',
          status: 'partial',
          implementation: 'General privacy policy exists',
          actions: ['Add California-specific section', 'List categories of data collected'],
          sources: [
            { name: 'CCPA Section 1798.130', url: 'https://oag.ca.gov/privacy/ccpa' }
          ]
        },
        {
          requirement: 'Do Not Sell My Personal Information',
          description: 'Link allowing users to opt-out of data sales',
          status: 'missing',
          implementation: 'Not implemented',
          notes: 'May not be required if not selling data',
          actions: ['Add "Do Not Sell" link if needed', 'Or add disclosure that data is not sold'],
          sources: [
            { name: 'CCPA Section 1798.135', url: 'https://oag.ca.gov/privacy/ccpa' }
          ]
        },
        {
          requirement: 'Right to Know',
          description: 'Users can request what data is collected',
          status: 'partial',
          implementation: 'Manual process via email',
          actions: ['Create formal request process', 'Document data categories'],
          sources: [
            { name: 'CCPA Section 1798.100', url: 'https://oag.ca.gov/privacy/ccpa' }
          ]
        },
        {
          requirement: 'Right to Delete',
          description: 'California residents can request deletion',
          status: 'partial',
          implementation: 'Same as GDPR deletion process',
          sources: [
            { name: 'CCPA Section 1798.105', url: 'https://oag.ca.gov/privacy/ccpa' }
          ]
        }
      ],
      references: [
        { name: 'California AG CCPA Page', url: 'https://oag.ca.gov/privacy/ccpa' },
        { name: 'CPRA Full Text', url: 'https://oag.ca.gov/privacy/cpra' }
      ]
    },
    'PCI': {
      name: 'PCI DSS (Payment Cards)',
      description: 'Payment Card Industry Data Security Standard',
      icon: '💳',
      items: [
        {
          requirement: 'Secure Payment Processing',
          description: 'Never store card details, use tokenization',
          status: 'compliant',
          implementation: 'Stripe handles all payment processing',
          notes: 'We never touch raw card data - Stripe is PCI Level 1 compliant',
          sources: [
            { name: 'PCI DSS Requirements', url: 'https://www.pcisecuritystandards.org/pci_security/' }
          ]
        },
        {
          requirement: 'SSL/TLS Encryption',
          description: 'All payment pages must use HTTPS',
          status: 'compliant',
          implementation: 'Vercel provides automatic SSL',
          sources: [
            { name: 'PCI DSS Requirement 4', url: 'https://www.pcisecuritystandards.org/' }
          ]
        },
        {
          requirement: 'Access Control',
          description: 'Limit access to payment data',
          status: 'compliant',
          implementation: 'Role-based access in admin panel',
          notes: 'Only admins can view order details',
          sources: [
            { name: 'PCI DSS Requirement 7', url: 'https://www.pcisecuritystandards.org/' }
          ]
        }
      ],
      references: [
        { name: 'PCI Security Standards', url: 'https://www.pcisecuritystandards.org/' },
        { name: 'Stripe PCI Compliance', url: 'https://stripe.com/guides/pci-compliance' }
      ]
    },
    'Ecommerce': {
      name: 'E-commerce & Consumer Protection',
      description: 'US FTC regulations and general e-commerce requirements',
      icon: '🛒',
      items: [
        {
          requirement: 'Terms of Service',
          description: 'Clear terms for purchases and use',
          status: 'compliant',
          implementation: 'Terms page at /terms',
          sources: [
            { name: 'FTC Guidelines', url: 'https://www.ftc.gov/business-guidance/resources' }
          ]
        },
        {
          requirement: 'Return/Refund Policy',
          description: 'Clear return and refund procedures',
          status: 'compliant',
          implementation: 'Returns page at /returns',
          notes: '30-day return policy documented',
          sources: [
            { name: 'FTC Mail Order Rule', url: 'https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule' }
          ]
        },
        {
          requirement: 'Accurate Product Descriptions',
          description: 'Products must be accurately described',
          status: 'compliant',
          implementation: 'Product pages with detailed descriptions',
          actions: ['Ensure all product images are actual products'],
          sources: [
            { name: 'FTC Act Section 5', url: 'https://www.ftc.gov/about-ftc/mission/enforcement-authority' }
          ]
        },
        {
          requirement: 'Pricing Transparency',
          description: 'Clear pricing including taxes and shipping',
          status: 'partial',
          implementation: 'Prices shown, shipping calculated at checkout',
          actions: ['Show estimated shipping earlier', 'Display tax estimates'],
          sources: [
            { name: 'FTC Advertising Guidelines', url: 'https://www.ftc.gov/business-guidance/advertising-marketing' }
          ]
        },
        {
          requirement: 'Order Confirmation',
          description: 'Send confirmation with order details',
          status: 'partial',
          implementation: 'Order confirmation page exists',
          actions: ['Set up email confirmations', 'Add order tracking'],
          sources: [
            { name: 'FTC Mail Order Rule', url: 'https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule' }
          ]
        }
      ],
      references: [
        { name: 'FTC E-commerce Guide', url: 'https://www.ftc.gov/business-guidance' },
        { name: 'FTC Mail Order Rule', url: 'https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule' }
      ]
    },
    'Accessibility': {
      name: 'ADA/WCAG Accessibility',
      description: 'Americans with Disabilities Act & Web Content Accessibility Guidelines',
      icon: '♿',
      items: [
        {
          requirement: 'Keyboard Navigation',
          description: 'All functions accessible via keyboard',
          status: 'partial',
          implementation: 'Most interactive elements are keyboard accessible',
          actions: ['Test full checkout flow with keyboard only', 'Add skip navigation links'],
          sources: [
            { name: 'WCAG 2.1.1', url: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' }
          ]
        },
        {
          requirement: 'Alt Text for Images',
          description: 'Images must have alternative text',
          status: 'partial',
          implementation: 'Product images have alt text',
          actions: ['Audit all images for alt text', 'Add descriptive alt text for game artwork'],
          sources: [
            { name: 'WCAG 1.1.1', url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html' }
          ]
        },
        {
          requirement: 'Color Contrast',
          description: 'Sufficient contrast for readability',
          status: 'compliant',
          implementation: 'High contrast orange/black theme',
          notes: 'Chaos mode can be disabled for accessibility',
          sources: [
            { name: 'WCAG 1.4.3', url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html' }
          ]
        },
        {
          requirement: 'Seizure Prevention',
          description: 'No content that causes seizures',
          status: 'compliant',
          implementation: 'Warning gate for chaos mode, ability to disable animations',
          sources: [
            { name: 'WCAG 2.3.1', url: 'https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html' }
          ]
        }
      ],
      references: [
        { name: 'WCAG 2.1 Guidelines', url: 'https://www.w3.org/WAI/WCAG21/quickref/' },
        { name: 'ADA Website Compliance', url: 'https://www.ada.gov/resources/web-guidance/' }
      ]
    },
    'Email': {
      name: 'CAN-SPAM & Email Marketing',
      description: 'Requirements for commercial email',
      icon: '📧',
      items: [
        {
          requirement: 'Unsubscribe Link',
          description: 'All marketing emails must have unsubscribe',
          status: 'missing',
          implementation: 'No email marketing system yet',
          actions: ['Set up email service provider', 'Implement unsubscribe functionality'],
          sources: [
            { name: 'CAN-SPAM Act', url: 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business' }
          ]
        },
        {
          requirement: 'Physical Address',
          description: 'Include valid postal address',
          status: 'missing',
          implementation: 'Not implemented',
          actions: ['Add business address to email templates'],
          sources: [
            { name: 'CAN-SPAM Requirements', url: 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business' }
          ]
        },
        {
          requirement: 'Accurate Headers',
          description: 'From, To, and Reply-To must be accurate',
          status: 'missing',
          implementation: 'No email system yet',
          sources: [
            { name: 'CAN-SPAM Act', url: 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business' }
          ]
        }
      ],
      references: [
        { name: 'CAN-SPAM Compliance Guide', url: 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business' }
      ]
    },
    'International': {
      name: 'International Compliance',
      description: 'Requirements for specific countries',
      icon: '🌍',
      items: [
        {
          requirement: 'Canada PIPEDA',
          description: 'Personal Information Protection Act',
          status: 'partial',
          implementation: 'Similar to GDPR compliance',
          sources: [
            { name: 'PIPEDA Overview', url: 'https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/' }
          ]
        },
        {
          requirement: 'UK GDPR',
          description: 'UK version of GDPR post-Brexit',
          status: 'partial',
          implementation: 'Same as EU GDPR compliance',
          sources: [
            { name: 'UK GDPR Guide', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/' }
          ]
        },
        {
          requirement: 'Australia Privacy Act',
          description: 'Australian Privacy Principles',
          status: 'partial',
          implementation: 'Basic privacy policy covers some requirements',
          actions: ['Review for Australia-specific requirements'],
          sources: [
            { name: 'Australian Privacy Act', url: 'https://www.oaic.gov.au/privacy/the-privacy-act' }
          ]
        }
      ],
      references: [
        { name: 'Global Privacy Law Map', url: 'https://iapp.org/resources/article/global-privacy-law-and-data-protection-map/' }
      ]
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Check size={20} style={{ color: '#10b981' }} />;
      case 'partial':
        return <AlertTriangle size={20} style={{ color: '#f59e0b' }} />;
      case 'missing':
        return <X size={20} style={{ color: '#ef4444' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return '#10b981';
      case 'partial':
        return '#f59e0b';
      case 'missing':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getComplianceScore = () => {
    let total = 0;
    let compliant = 0;
    let partial = 0;

    Object.values(complianceData).forEach(category => {
      category.items.forEach(item => {
        total++;
        if (item.status === 'compliant') compliant++;
        if (item.status === 'partial') partial += 0.5;
      });
    });

    return {
      score: Math.round(((compliant + partial) / total) * 100),
      total,
      compliant: Math.floor(compliant),
      partial: Math.floor(partial * 2),
      missing: total - Math.floor(compliant) - Math.floor(partial * 2)
    };
  };

  const score = getComplianceScore();

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={adminStyles.title}>
          <Shield size={32} style={{ marginRight: '0.75rem', verticalAlign: 'middle' }} />
          Legal Compliance Dashboard
        </h2>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
          Track legal requirements and compliance status across different jurisdictions
        </p>
      </div>

      {/* Compliance Score Card */}
      <div style={{
        ...adminStyles.card,
        background: `linear-gradient(135deg, #1f2937 0%, #111827 100%)`,
        border: '2px solid #374151',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: score.score >= 80 ? '#10b981' : score.score >= 60 ? '#f59e0b' : '#ef4444'
            }}>
              {score.score}%
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Overall Compliance Score</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={16} style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981' }}>{score.compliant} Compliant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
              <span style={{ color: '#f59e0b' }}>{score.partial} Partial</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <X size={16} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444' }}>{score.missing} Missing</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ 
              backgroundColor: '#374151', 
              borderRadius: '9999px', 
              height: '1rem',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${score.score}%`,
                height: '100%',
                background: `linear-gradient(90deg, #10b981 0%, #f59e0b ${score.score}%)`,
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              {score.total} total requirements tracked
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div style={{
        ...adminStyles.card,
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        border: '2px solid #f97316',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Info size={24} style={{ color: '#f97316', flexShrink: 0 }} />
          <div>
            <h3 style={{ color: '#fdba74', marginBottom: '0.5rem' }}>Legal Disclaimer</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6 }}>
              This compliance tracker is for informational purposes only and does not constitute legal advice. 
              Laws vary by jurisdiction and change frequently. Always consult with a qualified attorney for your specific situation. 
              This tool helps track common requirements but may not cover all applicable laws for your business.
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Categories */}
      {Object.entries(complianceData).map(([key, category]) => (
        <div key={key} style={{ ...adminStyles.card, marginBottom: '1.5rem' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: expandedCategories.has(key) ? '1.5rem' : 0
            }}
            onClick={() => toggleCategory(key)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
              <div>
                <h3 style={{ color: '#f97316', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                  {category.name}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{category.description}</p>
              </div>
            </div>
            {expandedCategories.has(key) ? 
              <ChevronUp size={24} style={{ color: '#6b7280' }} /> : 
              <ChevronDown size={24} style={{ color: '#6b7280' }} />
            }
          </div>

          {expandedCategories.has(key) && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {category.items.map((item, index) => (
                  <div 
                    key={index}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#0f172a',
                      borderRadius: '0.5rem',
                      borderLeft: `4px solid ${getStatusColor(item.status)}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      {getStatusIcon(item.status)}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#fdba74', marginBottom: '0.5rem' }}>
                          {item.requirement}
                        </h4>
                        <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          {item.description}
                        </p>
                        
                        <div style={{ 
                          padding: '0.75rem', 
                          backgroundColor: '#1e293b', 
                          borderRadius: '0.25rem',
                          marginBottom: '0.5rem'
                        }}>
                          <strong style={{ color: '#94a3b8', fontSize: '0.75rem' }}>IMPLEMENTATION:</strong>
                          <p style={{ color: '#e2e8f0', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            {item.implementation}
                          </p>
                        </div>

                        {item.notes && (
                          <p style={{ color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>
                            ℹ️ {item.notes}
                          </p>
                        )}

                        {item.actions && item.actions.length > 0 && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <strong style={{ color: '#f59e0b', fontSize: '0.75rem' }}>ACTION ITEMS:</strong>
                            <ul style={{ marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                              {item.actions.map((action, i) => (
                                <li key={i} style={{ color: '#fbbf24', fontSize: '0.875rem' }}>
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {item.sources && item.sources.length > 0 && (
                          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {item.sources.map((source, i) => (
                              <a
                                key={i}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#374151',
                                  borderRadius: '0.25rem',
                                  color: '#60a5fa',
                                  fontSize: '0.75rem',
                                  textDecoration: 'none',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                              >
                                <ExternalLink size={12} />
                                {source.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {category.references && category.references.length > 0 && (
                <div style={{ 
                  marginTop: '1.5rem', 
                  paddingTop: '1.5rem', 
                  borderTop: '1px solid #374151' 
                }}>
                  <h4 style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    📚 Additional Resources
                  </h4>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {category.references.map((ref, i) => (
                      <a
                        key={i}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#1e293b',
                          border: '1px solid #374151',
                          borderRadius: '0.5rem',
                          color: '#60a5fa',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#374151';
                          e.currentTarget.style.borderColor = '#60a5fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1e293b';
                          e.currentTarget.style.borderColor = '#374151';
                        }}
                      >
                        <ExternalLink size={16} />
                        {ref.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {/* Quick Actions */}
      <div style={{ ...adminStyles.card, marginTop: '2rem' }}>
        <h3 style={{ color: '#fdba74', marginBottom: '1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <button style={adminStyles.primaryButton}>
            Export Compliance Report
          </button>
          <button style={adminStyles.secondaryButton}>
            Schedule Legal Review
          </button>
          <button style={adminStyles.secondaryButton}>
            Update Privacy Policy
          </button>
          <button style={adminStyles.secondaryButton}>
            Test Cookie Consent
          </button>
        </div>
      </div>
    </div>
  );
}