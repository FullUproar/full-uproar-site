'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Users, Calendar, Clock, Target, Zap, 
  FileText, Image, Link, Bold, Italic, List, AlignLeft,
  Play, Pause, CheckCircle, XCircle, AlertCircle, TrendingUp,
  Eye, MousePointer, DollarSign, Percent, Award, Sparkles,
  BarChart3, PieChart, ArrowRight, Copy, Trash2, Edit2
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  type: 'broadcast' | 'automated' | 'transactional';
  audience: {
    segment: string;
    count: number;
    filters: any[];
  };
  schedule?: Date;
  content: {
    html: string;
    plainText: string;
  };
  metrics?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    revenue: number;
    unsubscribed: number;
    bounced: number;
  };
  createdAt: Date;
  sentAt?: Date;
}

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  content: string;
  variables: string[];
}

const emailTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'New Game Launch',
    category: 'Product Launch',
    thumbnail: '🚀',
    content: '<h1>{{game_name}} is HERE!</h1><p>Get ready for chaos...</p>',
    variables: ['game_name', 'price', 'launch_date']
  },
  {
    id: '2',
    name: 'Abandoned Cart Recovery',
    category: 'Retention',
    thumbnail: '🛒',
    content: '<h1>You left something fugly behind!</h1><p>Your cart misses you...</p>',
    variables: ['customer_name', 'cart_items', 'discount_code']
  },
  {
    id: '3',
    name: 'VIP Sale Announcement',
    category: 'Promotional',
    thumbnail: '👑',
    content: '<h1>VIP Access: {{discount}}% OFF Everything!</h1>',
    variables: ['customer_name', 'discount', 'expiry_date']
  },
  {
    id: '4',
    name: 'Win-Back Campaign',
    category: 'Retention',
    thumbnail: '💔',
    content: '<h1>We miss your beautiful chaos!</h1><p>Come back for {{offer}}...</p>',
    variables: ['customer_name', 'last_purchase_date', 'offer']
  },
  {
    id: '5',
    name: 'Review Request',
    category: 'Engagement',
    thumbnail: '⭐',
    content: '<h1>How fugly was your experience?</h1><p>Share your chaos story...</p>',
    variables: ['customer_name', 'product_name', 'order_date']
  },
  {
    id: '6',
    name: 'Birthday Surprise',
    category: 'Loyalty',
    thumbnail: '🎂',
    content: '<h1>Happy Fugly Birthday, {{customer_name}}!</h1>',
    variables: ['customer_name', 'birthday_discount', 'loyalty_points']
  }
];

export default function EmailCampaigns({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'automation' | 'analytics'>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  // Campaign creation form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    segment: 'all',
    scheduleType: 'now',
    scheduleDate: '',
    scheduleTime: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    // Mock data for demo
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Black Friday Mega Sale',
        subject: '🔥 50% OFF Everything - Chaos Unleashed!',
        status: 'sent',
        type: 'broadcast',
        audience: { segment: 'all', count: 1234, filters: [] },
        content: { html: '', plainText: '' },
        metrics: {
          sent: 1234,
          delivered: 1200,
          opened: 456,
          clicked: 123,
          converted: 45,
          revenue: 4567.89,
          unsubscribed: 2,
          bounced: 34
        },
        createdAt: new Date('2024-11-24'),
        sentAt: new Date('2024-11-24')
      },
      {
        id: '2',
        name: 'Welcome Series - Email 1',
        subject: 'Welcome to the Chaos Family!',
        status: 'sending',
        type: 'automated',
        audience: { segment: 'new_customers', count: 89, filters: [] },
        content: { html: '', plainText: '' },
        metrics: {
          sent: 89,
          delivered: 87,
          opened: 67,
          clicked: 34,
          converted: 12,
          revenue: 890.50,
          unsubscribed: 0,
          bounced: 2
        },
        createdAt: new Date('2024-12-01')
      },
      {
        id: '3',
        name: 'Abandoned Cart Reminder',
        subject: 'You forgot your fugly items!',
        status: 'scheduled',
        type: 'automated',
        audience: { segment: 'abandoned_carts', count: 45, filters: [] },
        schedule: new Date('2024-12-15T14:00:00'),
        content: { html: '', plainText: '' },
        createdAt: new Date('2024-12-10')
      }
    ];
    
    setCampaigns(mockCampaigns);
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch(status) {
      case 'sent': return '#10b981';
      case 'sending': return '#3b82f6';
      case 'scheduled': return '#f59e0b';
      case 'draft': return '#94a3b8';
      case 'paused': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const calculateOpenRate = (campaign: Campaign) => {
    if (!campaign.metrics || campaign.metrics.delivered === 0) return 0;
    return ((campaign.metrics.opened / campaign.metrics.delivered) * 100).toFixed(1);
  };

  const calculateClickRate = (campaign: Campaign) => {
    if (!campaign.metrics || campaign.metrics.opened === 0) return 0;
    return ((campaign.metrics.clicked / campaign.metrics.opened) * 100).toFixed(1);
  };

  const renderCampaignCreator = () => (
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
        maxWidth: '1200px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create Email Campaign</h2>
          <button
            onClick={() => setIsCreating(false)}
            style={adminStyles.iconButton}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Sidebar */}
          <div style={{
            padding: '2rem',
            borderRight: '1px solid #334155',
            overflowY: 'auto'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <label style={adminStyles.label}>Campaign Name</label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                style={adminStyles.input}
                placeholder="e.g., Holiday Sale 2024"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={adminStyles.label}>Subject Line</label>
              <input
                type="text"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
                style={adminStyles.input}
                placeholder="e.g., 🎄 50% OFF Everything!"
              />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Pro tip: Use emojis for 23% higher open rates!
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={adminStyles.label}>Audience Segment</label>
              <select
                value={newCampaign.segment}
                onChange={(e) => setNewCampaign({...newCampaign, segment: e.target.value})}
                style={adminStyles.input}
              >
                <option value="all">All Subscribers (1,234)</option>
                <option value="vip">VIP Customers (145)</option>
                <option value="new">New Customers (89)</option>
                <option value="inactive">Inactive (30+ days) (234)</option>
                <option value="high_value">High Value ($500+) (67)</option>
                <option value="cart_abandoners">Cart Abandoners (45)</option>
              </select>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={adminStyles.label}>Schedule</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    name="schedule"
                    value="now"
                    checked={newCampaign.scheduleType === 'now'}
                    onChange={(e) => setNewCampaign({...newCampaign, scheduleType: e.target.value})}
                  />
                  Send immediately
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="radio"
                    name="schedule"
                    value="scheduled"
                    checked={newCampaign.scheduleType === 'scheduled'}
                    onChange={(e) => setNewCampaign({...newCampaign, scheduleType: e.target.value})}
                  />
                  Schedule for later
                </label>
              </div>
              
              {newCampaign.scheduleType === 'scheduled' && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <input
                    type="date"
                    value={newCampaign.scheduleDate}
                    onChange={(e) => setNewCampaign({...newCampaign, scheduleDate: e.target.value})}
                    style={{ ...adminStyles.input, flex: 1 }}
                  />
                  <input
                    type="time"
                    value={newCampaign.scheduleTime}
                    onChange={(e) => setNewCampaign({...newCampaign, scheduleTime: e.target.value})}
                    style={{ ...adminStyles.input, flex: 1 }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={adminStyles.label}>A/B Testing</label>
              <button style={{
                ...adminStyles.secondaryButton,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Sparkles size={18} />
                Enable A/B Test
              </button>
            </div>
          </div>

          {/* Email Editor */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Template Selection */}
            <div style={{
              padding: '1rem 2rem',
              borderBottom: '1px solid #334155'
            }}>
              <p style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Choose a template:</p>
              <div style={{
                display: 'flex',
                gap: '1rem',
                overflowX: 'auto'
              }}>
                {emailTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    style={{
                      padding: '1rem',
                      background: selectedTemplate?.id === template.id ? '#334155' : '#0f172a',
                      border: selectedTemplate?.id === template.id ? '2px solid #f97316' : '2px solid transparent',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      minWidth: '120px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                      {template.thumbnail}
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                      {template.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {template.category}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Preview */}
            <div style={{
              flex: 1,
              padding: '2rem',
              overflowY: 'auto',
              background: '#0f172a'
            }}>
              <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                background: 'white',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
              }}>
                {/* Email Header */}
                <div style={{
                  background: '#f97316',
                  padding: '2rem',
                  textAlign: 'center'
                }}>
                  <h1 style={{ 
                    color: 'white', 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    margin: 0
                  }}>
                    FULL UPROAR GAMES
                  </h1>
                  <p style={{ color: 'white', marginTop: '0.5rem' }}>
                    Where Chaos Meets Fun
                  </p>
                </div>

                {/* Email Body */}
                <div style={{
                  padding: '2rem',
                  color: '#333',
                  lineHeight: 1.6
                }}>
                  {selectedTemplate ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
                  ) : (
                    <>
                      <h2 style={{ color: '#f97316', marginBottom: '1rem' }}>
                        Your Subject Line Here
                      </h2>
                      <p style={{ marginBottom: '1rem' }}>
                        Hi [Customer Name],
                      </p>
                      <p style={{ marginBottom: '1rem' }}>
                        Start creating your email content here. Choose a template from above or write your own!
                      </p>
                      <div style={{
                        textAlign: 'center',
                        margin: '2rem 0'
                      }}>
                        <a href="#" style={{
                          display: 'inline-block',
                          background: '#f97316',
                          color: 'white',
                          padding: '1rem 2rem',
                          borderRadius: '50px',
                          textDecoration: 'none',
                          fontWeight: 'bold'
                        }}>
                          SHOP NOW
                        </a>
                      </div>
                    </>
                  )}
                </div>

                {/* Email Footer */}
                <div style={{
                  background: '#f3f4f6',
                  padding: '1rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: '#666'
                }}>
                  <p>© 2024 Full Uproar Games. All rights reserved.</p>
                  <p>
                    <a href="#" style={{ color: '#f97316' }}>Unsubscribe</a> | 
                    <a href="#" style={{ color: '#f97316', marginLeft: '0.5rem' }}>View in browser</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '2rem',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={adminStyles.secondaryButton}>
              Save as Draft
            </button>
            <button style={adminStyles.secondaryButton}>
              Send Test Email
            </button>
          </div>
          
          <button style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Send size={18} />
            {newCampaign.scheduleType === 'now' ? 'Send Now' : 'Schedule Campaign'}
          </button>
        </div>
      </div>
    </div>
  );

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
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Email Marketing Hub</h1>
          <p style={{ color: '#94a3b8' }}>Engage, convert, and grow with powerful email campaigns</p>
        </div>
        
        <button
          onClick={() => setIsCreating(true)}
          style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Mail size={18} />
          Create Campaign
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #334155'
      }}>
        {[
          { id: 'campaigns', label: 'Campaigns', icon: <Mail size={18} /> },
          { id: 'templates', label: 'Templates', icon: <FileText size={18} /> },
          { id: 'automation', label: 'Automation', icon: <Zap size={18} /> },
          { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '1rem',
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? '#f97316' : '#94a3b8',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderBottom: activeTab === tab.id ? '2px solid #f97316' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      {activeTab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {campaigns.map(campaign => (
            <div key={campaign.id} style={{
              ...adminStyles.card,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '2rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{campaign.name}</h3>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: `${getStatusColor(campaign.status)}20`,
                    color: getStatusColor(campaign.status),
                    borderRadius: '50px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {campaign.status}
                  </span>
                </div>
                
                <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
                  <strong>Subject:</strong> {campaign.subject}
                </p>
                
                <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
                  <strong>Audience:</strong> {campaign.audience.segment} ({campaign.audience.count} recipients)
                </p>
                
                {campaign.metrics && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #334155'
                  }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        Open Rate
                      </p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                        {calculateOpenRate(campaign)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        Click Rate
                      </p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {calculateClickRate(campaign)}%
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        Conversions
                      </p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {campaign.metrics.converted}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                        Revenue
                      </p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        ${campaign.metrics.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button style={adminStyles.iconButton}>
                  <Copy size={18} />
                </button>
                <button style={adminStyles.iconButton}>
                  <Edit2 size={18} />
                </button>
                <button style={{ ...adminStyles.iconButton, color: '#ef4444' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Campaign Modal */}
      {isCreating && renderCampaignCreator()}
    </div>
  );
}