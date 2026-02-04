'use client';

import React, { useState, useEffect } from 'react';
import { 
  Book, Search, Video, FileText, CheckCircle, AlertCircle,
  ChevronRight, ChevronDown, Star, Clock, User, Shield,
  Package, ShoppingCart, CreditCard, Mail, Users, TrendingUp,
  HelpCircle, Zap, Award, Download, Printer, BookOpen,
  PlayCircle, PauseCircle, RefreshCw, ArrowRight, Target,
  AlertTriangle, CheckSquare, Copy, ExternalLink, Home,
  Lightbulb, Key, Settings, Database, BarChart3, Gift, Calendar, X
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface ManualSection {
  id: string;
  title: string;
  category: 'getting-started' | 'daily-ops' | 'advanced' | 'troubleshooting' | 'policies';
  icon: React.ReactNode;
  estimatedTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  roles: string[];
  content: {
    overview: string;
    steps?: Array<{
      title: string;
      description: string;
      warning?: string;
      tip?: string;
      screenshot?: string;
    }>;
    videos?: Array<{
      title: string;
      duration: string;
      url: string;
    }>;
    quickReference?: Array<{
      action: string;
      shortcut?: string;
      location: string;
    }>;
    commonIssues?: Array<{
      issue: string;
      solution: string;
      preventionTip?: string;
    }>;
  };
  lastUpdated: Date;
  completedBy?: string[];
}

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  section: string;
  required: boolean;
  estimatedTime: number;
  completed: boolean;
  completedAt?: Date;
}

const manualSections: ManualSection[] = [
  // Getting Started
  {
    id: 'admin-overview',
    title: 'Admin Panel Overview',
    category: 'getting-started',
    icon: <Home size={20} />,
    estimatedTime: 15,
    difficulty: 'beginner',
    roles: ['all'],
    content: {
      overview: 'Learn how to navigate the admin panel and understand its core features.',
      steps: [
        {
          title: 'Access the Admin Panel',
          description: 'Navigate to fulluproar.com/admin and log in with your admin credentials.',
          warning: 'Never share your admin credentials. Use 2FA when available.',
          tip: 'Bookmark the admin URL for quick access.'
        },
        {
          title: 'Understanding the Dashboard',
          description: 'The main dashboard shows key metrics: revenue, orders, customers, and inventory levels.',
          tip: 'Customize your dashboard by clicking the settings icon in the top right.'
        },
        {
          title: 'Navigation Menu',
          description: 'Use the left sidebar to access different sections. Icons indicate new features or alerts.',
          tip: 'Press "/" to quickly search for any function.'
        }
      ],
      quickReference: [
        { action: 'Quick Search', shortcut: '/', location: 'Anywhere' },
        { action: 'Toggle Sidebar', shortcut: 'Ctrl+B', location: 'Anywhere' },
        { action: 'View Notifications', shortcut: 'N', location: 'Dashboard' }
      ]
    },
    lastUpdated: new Date('2025-01-01')
  },
  
  // Order Processing
  {
    id: 'order-processing',
    title: 'Processing Orders',
    category: 'daily-ops',
    icon: <ShoppingCart size={20} />,
    estimatedTime: 20,
    difficulty: 'beginner',
    roles: ['admin', 'fulfillment'],
    content: {
      overview: 'Complete guide to processing customer orders from placement to delivery.',
      steps: [
        {
          title: 'Review New Orders',
          description: 'Go to Orders → Filter by "New". Review customer details and items ordered.',
          warning: 'Always verify shipping address for international orders.',
          tip: 'Use bulk actions for multiple orders going to the same region.'
        },
        {
          title: 'Verify Payment',
          description: 'Check that payment status shows "Paid" before processing.',
          warning: 'Never ship orders marked as "Payment Pending" or "Failed".',
        },
        {
          title: 'Pick & Pack Items',
          description: 'Print pick list, gather items from inventory, pack securely with branded materials.',
          tip: 'Include a Chaos Card (free gift) in orders over $50.'
        },
        {
          title: 'Generate Shipping Label',
          description: 'Click "Create Label" → Select carrier → Print label and attach to package.',
          warning: 'Double-check weight and dimensions for accurate shipping costs.'
        },
        {
          title: 'Update Order Status',
          description: 'Mark as "Shipped" and enter tracking number. Customer receives automatic notification.',
          tip: 'Take a photo of packaged items for high-value orders.'
        }
      ],
      commonIssues: [
        {
          issue: 'Address validation failed',
          solution: 'Use USPS address verification tool or contact customer for clarification.',
          preventionTip: 'Enable address validation at checkout.'
        },
        {
          issue: 'Item out of stock after order placed',
          solution: 'Contact customer immediately with options: wait for restock, substitute, or refund.',
          preventionTip: 'Set up low stock alerts and safety stock levels.'
        },
        {
          issue: 'International shipping restrictions',
          solution: 'Check country-specific regulations. Some items may require special documentation.',
          preventionTip: 'Maintain a list of restricted items by country.'
        }
      ],
      quickReference: [
        { action: 'Print Pick List', shortcut: 'Ctrl+P', location: 'Order Details' },
        { action: 'Quick Status Update', shortcut: 'S', location: 'Order List' },
        { action: 'Generate Label', shortcut: 'L', location: 'Order Details' }
      ]
    },
    lastUpdated: new Date('2025-01-01')
  },

  // Inventory Management
  {
    id: 'inventory-management',
    title: 'Managing Inventory',
    category: 'daily-ops',
    icon: <Package size={20} />,
    estimatedTime: 25,
    difficulty: 'intermediate',
    roles: ['admin', 'inventory'],
    content: {
      overview: 'Keep accurate inventory counts and manage stock levels effectively.',
      steps: [
        {
          title: 'Daily Inventory Count',
          description: 'Each morning, verify physical counts match system counts for top 10 sellers.',
          tip: 'Use the mobile app for faster counting with barcode scanning.'
        },
        {
          title: 'Receiving New Stock',
          description: 'Scan items → Enter quantities → Update system → Place in designated locations.',
          warning: 'Always check for damage before accepting shipments.',
        },
        {
          title: 'Setting Reorder Points',
          description: 'Navigate to Product Intel → Set reorder point at 2x weekly sales velocity.',
          tip: 'Account for seasonality - increase reorder points before holidays.'
        },
        {
          title: 'Managing Product Variants',
          description: 'For merchandise with sizes/colors, track each variant separately.',
          warning: 'Never combine variant counts - each SKU needs individual tracking.'
        }
      ],
      commonIssues: [
        {
          issue: 'Inventory discrepancy found',
          solution: 'Conduct immediate recount, check recent orders for packing errors, adjust system count.',
          preventionTip: 'Implement cycle counting - count 10% of inventory daily.'
        },
        {
          issue: 'Damaged inventory discovered',
          solution: 'Move to damage hold, document with photos, file claim if applicable, adjust counts.',
          preventionTip: 'Inspect all incoming shipments before putting away.'
        }
      ]
    },
    lastUpdated: new Date('2025-01-01')
  },

  // Customer Service
  {
    id: 'customer-service',
    title: 'Customer Service Excellence',
    category: 'daily-ops',
    icon: <Users size={20} />,
    estimatedTime: 30,
    difficulty: 'beginner',
    roles: ['all'],
    content: {
      overview: 'Deliver exceptional customer service that builds loyalty and drives sales.',
      steps: [
        {
          title: 'Responding to Inquiries',
          description: 'Check support tickets every 2 hours. Respond within 4 hours during business hours.',
          tip: 'Use templates for common questions but personalize the greeting and closing.',
          warning: 'Never promise what we cannot deliver. Under-promise, over-deliver.'
        },
        {
          title: 'Processing Returns',
          description: 'Verify return request → Issue RMA number → Process refund upon receipt.',
          warning: 'Check return policy (30 days) before approving.',
          tip: 'Offer store credit (+10%) to retain the sale.'
        },
        {
          title: 'Handling Complaints',
          description: 'Listen → Empathize → Apologize → Resolve → Follow up.',
          tip: 'Escalate to supervisor if customer requests it or if resolution exceeds $50.'
        },
        {
          title: 'Afterroar+ Support',
          description: 'Afterroar+ members get priority support. Respond within 2 hours, offer exclusive solutions.',
          warning: 'Always verify Afterroar+ status before offering subscriber-only benefits.'
        }
      ],
      quickReference: [
        { action: 'View Customer History', shortcut: 'H', location: 'Customer Profile' },
        { action: 'Send Template Response', shortcut: 'T', location: 'Ticket View' },
        { action: 'Escalate Ticket', shortcut: 'E', location: 'Ticket View' }
      ],
      commonIssues: [
        {
          issue: 'Customer didn\'t receive order',
          solution: 'Check tracking → If delivered, file claim → Send replacement immediately for Afterroar+ members.',
          preventionTip: 'Always require signature for orders over $100.'
        },
        {
          issue: 'Wrong item received',
          solution: 'Apologize → Send correct item immediately → Include return label for wrong item.',
          preventionTip: 'Double-check picks during packing, especially for similar items.'
        }
      ]
    },
    lastUpdated: new Date('2025-01-01')
  },

  // Marketing Operations
  {
    id: 'marketing-ops',
    title: 'Marketing & Campaigns',
    category: 'advanced',
    icon: <TrendingUp size={20} />,
    estimatedTime: 45,
    difficulty: 'intermediate',
    roles: ['admin', 'marketing'],
    content: {
      overview: 'Execute marketing campaigns and manage promotional activities.',
      steps: [
        {
          title: 'Creating Email Campaigns',
          description: 'Email Marketing → Create Campaign → Select template → Choose segment → Schedule.',
          warning: 'Always send test email to team before broadcasting.',
          tip: 'Best send times: Tuesday-Thursday, 10am or 2pm customer timezone.'
        },
        {
          title: 'Managing Discounts',
          description: 'Create promo codes with specific rules: percentage/fixed, minimum purchase, expiry.',
          warning: 'Never stack discounts unless specifically approved.',
          tip: 'Use unique codes for tracking campaign performance.'
        },
        {
          title: 'Affiliate Management',
          description: 'Review applications → Approve affiliates → Set commission rates → Track performance.',
          tip: 'Top performers get higher commission rates and exclusive products to promote.'
        },
        {
          title: 'Chaos Box Curation',
          description: 'Monthly task: Select 4-5 items totaling $50+ value → Write description → Photograph.',
          warning: 'Finalize contents by the 15th of previous month for ordering.',
          tip: 'Include at least one exclusive item in each box.'
        }
      ],
      quickReference: [
        { action: 'Schedule Campaign', location: 'Email Marketing → Calendar' },
        { action: 'View Campaign Analytics', location: 'War Room → Attribution' },
        { action: 'Create Promo Code', location: 'Marketing → Discounts' }
      ]
    },
    lastUpdated: new Date('2025-01-01')
  },

  // Financial Operations
  {
    id: 'financial-ops',
    title: 'Financial Management',
    category: 'advanced',
    icon: <CreditCard size={20} />,
    estimatedTime: 40,
    difficulty: 'advanced',
    roles: ['admin', 'finance'],
    content: {
      overview: 'Handle financial operations including refunds, payouts, and reporting.',
      steps: [
        {
          title: 'Processing Refunds',
          description: 'Orders → Select order → Refund → Choose full/partial → Add reason → Process.',
          warning: 'Refunds over $500 require supervisor approval.',
          tip: 'Always document reason for accounting purposes.'
        },
        {
          title: 'Affiliate Payouts',
          description: 'Monthly on the 1st: Review pending commissions → Verify → Process via PayPal/Bank.',
          warning: 'Verify tax forms (W-9) before first payout.',
        },
        {
          title: 'COGS Tracking',
          description: 'Product Intel → Update component costs monthly based on supplier invoices.',
          tip: 'Set calendar reminder for first Monday of each month.'
        },
        {
          title: 'Revenue Reporting',
          description: 'Generate monthly P&L: Dashboard → Reports → Select date range → Export.',
          warning: 'Reconcile with bank statements before finalizing.'
        }
      ],
      commonIssues: [
        {
          issue: 'Payment failed but order processed',
          solution: 'Contact customer for updated payment → Hold shipment until resolved.',
          preventionTip: 'Enable payment verification before order confirmation.'
        },
        {
          issue: 'Chargeback received',
          solution: 'Gather evidence (tracking, emails) → Submit dispute within 7 days.',
          preventionTip: 'Always get signature confirmation for high-value orders.'
        }
      ]
    },
    lastUpdated: new Date('2025-01-01')
  },

  // Security & Compliance
  {
    id: 'security-compliance',
    title: 'Security & Compliance',
    category: 'policies',
    icon: <Shield size={20} />,
    estimatedTime: 30,
    difficulty: 'intermediate',
    roles: ['all'],
    content: {
      overview: 'Maintain security standards and ensure compliance with policies.',
      steps: [
        {
          title: 'Password Security',
          description: 'Use unique, complex passwords. Change every 90 days. Never share credentials.',
          warning: 'Immediate termination for sharing admin credentials.',
          tip: 'Use password manager for generating and storing passwords.'
        },
        {
          title: 'Data Protection',
          description: 'Never export customer data to personal devices. Use encrypted channels for sensitive info.',
          warning: 'GDPR/CCPA compliance required - hefty fines for violations.'
        },
        {
          title: 'PCI Compliance',
          description: 'Never store credit card numbers. All payments through Stripe only.',
          warning: 'Never ask customers for full card details via email or phone.'
        },
        {
          title: 'Access Control',
          description: 'Lock workstation when away. Log out at end of shift. Report suspicious activity.',
          tip: 'Windows+L quickly locks your screen.'
        }
      ],
      quickReference: [
        { action: 'Report Security Issue', location: 'admin@fulluproar.com' },
        { action: 'View Access Logs', location: 'Settings → Security' },
        { action: 'Emergency Lockdown', location: 'Settings → Security → Emergency' }
      ]
    },
    lastUpdated: new Date('2025-01-01')
  },

  // Troubleshooting
  {
    id: 'troubleshooting',
    title: 'Troubleshooting Guide',
    category: 'troubleshooting',
    icon: <AlertTriangle size={20} />,
    estimatedTime: 20,
    difficulty: 'intermediate',
    roles: ['all'],
    content: {
      overview: 'Quick solutions to common technical issues.',
      commonIssues: [
        {
          issue: 'Admin panel won\'t load',
          solution: 'Clear browser cache → Try incognito mode → Check status.fulluproar.com.',
          preventionTip: 'Keep browser updated and disable problematic extensions.'
        },
        {
          issue: 'Can\'t update product information',
          solution: 'Check permissions → Verify no one else editing → Try different browser.',
          preventionTip: 'Always save drafts frequently when editing.'
        },
        {
          issue: 'Email campaign won\'t send',
          solution: 'Verify email list has recipients → Check sender verification → Review spam score.',
          preventionTip: 'Always send test emails before scheduling campaigns.'
        },
        {
          issue: 'Inventory counts don\'t match',
          solution: 'Check recent orders → Review damage reports → Look for pending transfers.',
          preventionTip: 'Perform daily cycle counts on high-velocity items.'
        },
        {
          issue: 'Payment processing errors',
          solution: 'Check Stripe dashboard → Verify API keys → Contact support if persistent.',
          preventionTip: 'Monitor Stripe status page for known issues.'
        }
      ]
    },
    lastUpdated: new Date('2025-01-01')
  }
];

export default function OperatorManual({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<ManualSection | null>(null);
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [activeRole, setActiveRole] = useState<string>('admin');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['getting-started']);

  // Onboarding tasks
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTask[]>([
    {
      id: '1',
      title: 'Complete Admin Panel Overview',
      description: 'Learn how to navigate the admin panel',
      section: 'admin-overview',
      required: true,
      estimatedTime: 15,
      completed: false
    },
    {
      id: '2',
      title: 'Practice Order Processing',
      description: 'Process a test order from start to finish',
      section: 'order-processing',
      required: true,
      estimatedTime: 20,
      completed: false
    },
    {
      id: '3',
      title: 'Review Security Policies',
      description: 'Understand security requirements and compliance',
      section: 'security-compliance',
      required: true,
      estimatedTime: 30,
      completed: false
    },
    {
      id: '4',
      title: 'Customer Service Training',
      description: 'Learn our service standards and response templates',
      section: 'customer-service',
      required: true,
      estimatedTime: 30,
      completed: false
    }
  ]);

  const categories = [
    { id: 'all', label: 'All Sections', icon: <Book size={18} /> },
    { id: 'getting-started', label: 'Getting Started', icon: <Zap size={18} /> },
    { id: 'daily-ops', label: 'Daily Operations', icon: <RefreshCw size={18} /> },
    { id: 'advanced', label: 'Advanced', icon: <Award size={18} /> },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: <AlertTriangle size={18} /> },
    { id: 'policies', label: 'Policies', icon: <Shield size={18} /> }
  ];

  const filteredSections = manualSections.filter(section => {
    const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.content.overview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    const matchesRole = section.roles.includes('all') || section.roles.includes(activeRole);
    
    return matchesSearch && matchesCategory && matchesRole;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const markAsComplete = (sectionId: string) => {
    setCompletedSections(prev => [...prev, sectionId]);
    
    // Update onboarding task if applicable
    setOnboardingTasks(prev => prev.map(task => 
      task.section === sectionId 
        ? { ...task, completed: true, completedAt: new Date() }
        : task
    ));
  };

  const renderSectionContent = () => {
    if (!selectedSection) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '70%',
        height: '100vh',
        background: '#1e293b',
        overflowY: 'auto',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        zIndex: 100
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid #334155',
          background: '#0f172a',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {selectedSection.title}
              </h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: `${getDifficultyColor(selectedSection.difficulty)}20`,
                  color: getDifficultyColor(selectedSection.difficulty),
                  borderRadius: '50px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {selectedSection.difficulty}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                  <Clock size={14} />
                  {selectedSection.estimatedTime} min
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                  <Calendar size={14} />
                  Updated: {new Date(selectedSection.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={adminStyles.iconButton}>
                <Printer size={18} />
              </button>
              <button style={adminStyles.iconButton}>
                <Download size={18} />
              </button>
              <button 
                onClick={() => setSelectedSection(null)}
                style={adminStyles.iconButton}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {/* Overview */}
          <div style={{
            ...adminStyles.card,
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.05) 100%)',
            borderLeft: '3px solid #FF8200'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lightbulb size={20} style={{ color: '#FF8200' }} />
              Overview
            </h3>
            <p style={{ lineHeight: 1.6 }}>{selectedSection.content.overview}</p>
          </div>

          {/* Steps */}
          {selectedSection.content.steps && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>Step-by-Step Instructions</h3>
              {selectedSection.content.steps.map((step, index) => (
                <div key={index} style={{
                  ...adminStyles.card,
                  marginBottom: '1rem',
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{step.title}</h4>
                      <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>{step.description}</p>
                      
                      {step.warning && (
                        <div style={{
                          padding: '0.75rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <p style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                            <AlertCircle size={16} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{step.warning}</span>
                          </p>
                        </div>
                      )}
                      
                      {step.tip && (
                        <div style={{
                          padding: '0.75rem',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          borderRadius: '0.5rem'
                        }}>
                          <p style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                            <Lightbulb size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ color: '#10b981', fontSize: '0.875rem' }}>{step.tip}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Reference */}
          {selectedSection.content.quickReference && (
            <div style={{
              ...adminStyles.card,
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Quick Reference</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #334155' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Shortcut</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSection.content.quickReference.map((ref, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '0.75rem' }}>{ref.action}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {ref.shortcut && (
                          <code style={{
                            padding: '0.25rem 0.5rem',
                            background: '#0f172a',
                            borderRadius: '0.25rem',
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                          }}>
                            {ref.shortcut}
                          </code>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{ref.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Common Issues */}
          {selectedSection.content.commonIssues && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Common Issues & Solutions</h3>
              {selectedSection.content.commonIssues.map((issue, index) => (
                <div key={index} style={{
                  ...adminStyles.card,
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                    <HelpCircle size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#f59e0b' }}>
                        {issue.issue}
                      </p>
                      <p style={{ marginBottom: '0.5rem' }}>{issue.solution}</p>
                      {issue.preventionTip && (
                        <p style={{ fontSize: '0.875rem', color: '#10b981' }}>
                          💡 Prevention: {issue.preventionTip}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mark as Complete */}
          <div style={{
            padding: '2rem',
            background: '#0f172a',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            {completedSections.includes(selectedSection.id) ? (
              <div>
                <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                  Section Completed!
                </p>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                  You've mastered this section. Great job!
                </p>
              </div>
            ) : (
              <div>
                <p style={{ marginBottom: '1rem', color: '#94a3b8' }}>
                  Have you completed this section?
                </p>
                <button
                  onClick={() => markAsComplete(selectedSection.id)}
                  style={{
                    ...adminStyles.button,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <CheckSquare size={18} />
                  Mark as Complete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOnboarding = () => {
    const completedCount = onboardingTasks.filter(t => t.completed).length;
    const progress = (completedCount / onboardingTasks.length) * 100;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          background: '#1e293b',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '2rem',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                New Employee Onboarding
              </h2>
              <button
                onClick={() => setShowOnboarding(false)}
                style={adminStyles.iconButton}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
              Complete these essential training modules to get started
            </p>
            
            {/* Progress Bar */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Progress</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                  {completedCount}/{onboardingTasks.length} completed
                </span>
              </div>
              <div style={{
                height: '8px',
                background: '#0f172a',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          </div>

          <div style={{
            padding: '2rem',
            overflowY: 'auto',
            maxHeight: 'calc(80vh - 180px)'
          }}>
            {onboardingTasks.map(task => (
              <div key={task.id} style={{
                ...adminStyles.card,
                marginBottom: '1rem',
                borderLeft: `3px solid ${task.completed ? '#10b981' : task.required ? '#ef4444' : '#f59e0b'}`
              }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: task.completed ? '#10b981' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {task.completed ? <CheckCircle size={18} /> : <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: '2px solid #64748b'
                    }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {task.title}
                          {task.required && (
                            <span style={{
                              marginLeft: '0.5rem',
                              padding: '0.125rem 0.5rem',
                              background: '#ef444420',
                              color: '#ef4444',
                              borderRadius: '50px',
                              fontSize: '0.75rem'
                            }}>
                              Required
                            </span>
                          )}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                          {task.description}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                          Estimated time: {task.estimatedTime} minutes
                        </p>
                      </div>
                      {!task.completed && (
                        <button
                          onClick={() => {
                            const section = manualSections.find(s => s.id === task.section);
                            if (section) {
                              setSelectedSection(section);
                              setShowOnboarding(false);
                            }
                          }}
                          style={{
                            ...adminStyles.button,
                            padding: '0.5rem 1rem'
                          }}
                        >
                          Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Operator Manual</h1>
          <p style={{ color: '#94a3b8' }}>
            Training resources, SOPs, and documentation for team members
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setShowOnboarding(true)}
            style={{
              ...adminStyles.secondaryButton,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Award size={18} />
            Onboarding Checklist
          </button>
          <button style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #FF8200 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <PlayCircle size={18} />
            Video Tutorials
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b'
          }} />
          <input
            type="text"
            placeholder="Search manuals, procedures, or troubleshooting..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...adminStyles.input,
              width: '100%',
              paddingLeft: '3rem'
            }}
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={adminStyles.input}
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        
        <select
          value={activeRole}
          onChange={(e) => setActiveRole(e.target.value)}
          style={adminStyles.input}
        >
          <option value="admin">Admin</option>
          <option value="fulfillment">Fulfillment</option>
          <option value="marketing">Marketing</option>
          <option value="finance">Finance</option>
          <option value="inventory">Inventory</option>
        </select>
      </div>

      {/* Progress Overview */}
      <div style={{
        ...adminStyles.card,
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)',
        borderLeft: '3px solid #10b981'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Your Training Progress</h3>
            <p style={{ color: '#94a3b8' }}>
              You've completed {completedSections.length} of {manualSections.length} training sections
            </p>
          </div>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {Math.round((completedSections.length / manualSections.length) * 100)}%
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Complete</span>
          </div>
        </div>
      </div>

      {/* Manual Sections Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedSection ? '1fr' : '1fr',
        gap: '1.5rem'
      }}>
        <div>
          {categories
            .filter(cat => cat.id !== 'all')
            .map(category => {
              const categorySections = filteredSections.filter(s => s.category === category.id);
              if (categorySections.length === 0) return null;

              return (
                <div key={category.id} style={{ marginBottom: '2rem' }}>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      marginBottom: '1rem',
                      fontSize: '1.125rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {expandedCategories.includes(category.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    {category.icon}
                    {category.label}
                    <span style={{
                      marginLeft: '0.5rem',
                      padding: '0.125rem 0.5rem',
                      background: '#334155',
                      borderRadius: '50px',
                      fontSize: '0.75rem'
                    }}>
                      {categorySections.length}
                    </span>
                  </button>

                  {expandedCategories.includes(category.id) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '1rem'
                    }}>
                      {categorySections.map(section => (
                        <div
                          key={section.id}
                          onClick={() => setSelectedSection(section)}
                          style={{
                            ...adminStyles.card,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            borderLeft: `3px solid ${completedSections.includes(section.id) ? '#10b981' : '#334155'}`,
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '';
                          }}
                        >
                          {completedSections.includes(section.id) && (
                            <CheckCircle size={20} style={{
                              position: 'absolute',
                              top: '1rem',
                              right: '1rem',
                              color: '#10b981'
                            }} />
                          )}
                          
                          <div style={{ marginBottom: '1rem' }}>{section.icon}</div>
                          
                          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {section.title}
                          </h3>
                          
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#94a3b8',
                            marginBottom: '1rem',
                            lineHeight: 1.5
                          }}>
                            {section.content.overview.substring(0, 100)}...
                          </p>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                background: `${getDifficultyColor(section.difficulty)}20`,
                                color: getDifficultyColor(section.difficulty),
                                borderRadius: '50px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}>
                                {section.difficulty}
                              </span>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                background: '#334155',
                                borderRadius: '50px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <Clock size={12} />
                                {section.estimatedTime}m
                              </span>
                            </div>
                            <ArrowRight size={16} style={{ color: '#64748b' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Section Content Panel */}
      {renderSectionContent()}
      
      {/* Onboarding Modal */}
      {showOnboarding && renderOnboarding()}
    </div>
  );
}