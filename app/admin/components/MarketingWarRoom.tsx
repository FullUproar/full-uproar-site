'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, TrendingUp, DollarSign, Calendar, Clock, Users, 
  BarChart3, PieChart, Activity, Zap, Brain, Globe, 
  Facebook, Instagram, Twitter, Youtube, Mail, MessageSquare,
  Link2, ExternalLink, Copy, Plus, Edit2, Trash2, Play,
  Pause, CheckCircle, AlertCircle, Info, ArrowRight, Eye,
  MousePointer, ShoppingCart, CreditCard, Package, Repeat,
  Layers, GitBranch, Filter, Download, Upload, Settings
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Campaign {
  id: string;
  name: string;
  type: 'product-launch' | 'seasonal' | 'retention' | 'acquisition' | 'brand';
  status: 'planning' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  channels: Channel[];
  goals: Goal[];
  segments: string[];
  attribution: Attribution;
  performance: Performance;
}

interface Channel {
  type: 'email' | 'social' | 'paid-search' | 'paid-social' | 'organic' | 'affiliate' | 'influencer';
  platform?: string;
  budget: number;
  spent: number;
  status: 'planned' | 'active' | 'completed';
  metrics: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    revenue?: number;
  };
}

interface Goal {
  metric: string;
  target: number;
  current: number;
  unit: string;
}

interface Attribution {
  model: 'last-click' | 'first-click' | 'linear' | 'time-decay' | 'data-driven';
  touchpoints: TouchPoint[];
  revenue: number;
  roas: number;
}

interface TouchPoint {
  channel: string;
  timestamp: Date;
  value: number;
  conversion: boolean;
}

interface Performance {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  roas: number;
  cac: number;
  ltv: number;
}

export default function MarketingWarRoom({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [activeTab, setActiveTab] = useState<'planner' | 'attribution' | 'intelligence' | 'experiments'>('planner');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [isCreating, setIsCreating] = useState(false);
  
  // Attribution tracking data
  const [pixelEvents, setPixelEvents] = useState<any[]>([]);
  const [conversionPaths, setConversionPaths] = useState<any[]>([]);
  
  useEffect(() => {
    fetchCampaigns();
    fetchPixelData();
  }, [dateRange]);

  const fetchCampaigns = async () => {
    // Mock data for demonstration
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Holiday Chaos Campaign 2024',
        type: 'seasonal',
        status: 'active',
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-12-31'),
        budget: 10000,
        spent: 4567,
        channels: [
          {
            type: 'paid-social',
            platform: 'Facebook',
            budget: 3000,
            spent: 1500,
            status: 'active',
            metrics: {
              impressions: 45000,
              clicks: 1250,
              conversions: 89,
              revenue: 3456
            }
          },
          {
            type: 'email',
            budget: 1000,
            spent: 200,
            status: 'active',
            metrics: {
              impressions: 5000,
              clicks: 450,
              conversions: 34,
              revenue: 1234
            }
          },
          {
            type: 'paid-search',
            platform: 'Google',
            budget: 4000,
            spent: 2500,
            status: 'active',
            metrics: {
              impressions: 12000,
              clicks: 890,
              conversions: 67,
              revenue: 5678
            }
          }
        ],
        goals: [
          { metric: 'Revenue', target: 50000, current: 23456, unit: '$' },
          { metric: 'New Customers', target: 500, current: 234, unit: '' },
          { metric: 'ROAS', target: 5, current: 4.2, unit: 'x' }
        ],
        segments: ['VIP', 'New Customers', 'Cart Abandoners'],
        attribution: {
          model: 'data-driven',
          touchpoints: [],
          revenue: 23456,
          roas: 4.2
        },
        performance: {
          impressions: 62000,
          clicks: 2590,
          ctr: 4.2,
          conversions: 190,
          conversionRate: 7.3,
          revenue: 23456,
          roas: 4.2,
          cac: 24.5,
          ltv: 487
        }
      }
    ];
    
    setCampaigns(mockCampaigns);
    if (mockCampaigns.length > 0) {
      setSelectedCampaign(mockCampaigns[0]);
    }
  };

  const fetchPixelData = async () => {
    try {
      // Fetch real pixel data from your analytics
      const response = await fetch(`/api/analytics?range=${dateRange}`);
      const data = await response.json();
      
      // Process pixel events for attribution
      processAttributionData(data);
    } catch (error) {
      console.error('Error fetching pixel data:', error);
    }
  };

  const processAttributionData = (data: any) => {
    // Process conversion paths from pixel data
    const paths = data.events?.filter((e: any) => e.type === 'purchase').map((purchase: any) => {
      // Find all touchpoints for this user before conversion
      const userEvents = data.events.filter((e: any) => 
        e.userId === purchase.userId && 
        new Date(e.timestamp) <= new Date(purchase.timestamp)
      );
      
      return {
        conversionValue: purchase.value,
        touchpoints: userEvents.map((e: any) => ({
          channel: e.source || 'direct',
          timestamp: e.timestamp,
          type: e.type
        }))
      };
    }) || [];
    
    setConversionPaths(paths);
  };

  const generateUTMLink = (baseUrl: string, campaign: string, source: string, medium: string) => {
    const params = new URLSearchParams({
      utm_campaign: campaign.toLowerCase().replace(/\s+/g, '-'),
      utm_source: source,
      utm_medium: medium,
      utm_content: `${Date.now()}`
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show toast notification
  };

  const renderCampaignPlanner = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '2rem',
      height: 'calc(100vh - 250px)'
    }}>
      {/* Campaign List Sidebar */}
      <div style={{
        ...adminStyles.card,
        overflowY: 'auto',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ fontWeight: 'bold' }}>Campaigns</h3>
          <button
            onClick={() => setIsCreating(true)}
            style={adminStyles.iconButton}
          >
            <Plus size={18} />
          </button>
        </div>
        
        {campaigns.map(campaign => (
          <div
            key={campaign.id}
            onClick={() => setSelectedCampaign(campaign)}
            style={{
              padding: '1rem',
              marginBottom: '0.5rem',
              background: selectedCampaign?.id === campaign.id ? '#334155' : '#1e293b',
              borderLeft: selectedCampaign?.id === campaign.id ? '3px solid #f97316' : '3px solid transparent',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {campaign.name}
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {campaign.channels.length} channels • ${campaign.spent.toLocaleString()} spent
                </p>
              </div>
              <span style={{
                padding: '0.25rem 0.5rem',
                background: campaign.status === 'active' ? '#10b98120' : '#94a3b820',
                color: campaign.status === 'active' ? '#10b981' : '#94a3b8',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {campaign.status}
              </span>
            </div>
            
            {/* Mini progress bar */}
            <div style={{
              marginTop: '0.75rem',
              height: '4px',
              background: '#0f172a',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(campaign.spent / campaign.budget) * 100}%`,
                height: '100%',
                background: campaign.spent > campaign.budget * 0.9 ? '#ef4444' : '#f97316'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Campaign Detail */}
      {selectedCampaign && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Campaign Header */}
          <div style={adminStyles.card}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'start',
              marginBottom: '1.5rem'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {selectedCampaign.name}
                </h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                    <Calendar size={14} />
                    {new Date(selectedCampaign.startDate).toLocaleDateString()} - 
                    {new Date(selectedCampaign.endDate).toLocaleDateString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                    <Users size={14} />
                    {selectedCampaign.segments.join(', ')}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button style={adminStyles.secondaryButton}>
                  <Edit2 size={18} />
                  Edit
                </button>
                <button style={{
                  ...adminStyles.button,
                  background: selectedCampaign.status === 'active' 
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #10b981, #059669)'
                }}>
                  {selectedCampaign.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                  {selectedCampaign.status === 'active' ? 'Pause' : 'Activate'}
                </button>
              </div>
            </div>

            {/* Budget and Performance */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem'
            }}>
              <div style={{
                padding: '1rem',
                background: '#0f172a',
                borderRadius: '0.5rem'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Budget Utilization
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f97316' }}>
                  {((selectedCampaign.spent / selectedCampaign.budget) * 100).toFixed(0)}%
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  ${selectedCampaign.spent.toLocaleString()} / ${selectedCampaign.budget.toLocaleString()}
                </p>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#0f172a',
                borderRadius: '0.5rem'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Return on Ad Spend
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                  {selectedCampaign.performance.roas.toFixed(1)}x
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  ${selectedCampaign.performance.revenue.toLocaleString()} revenue
                </p>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#0f172a',
                borderRadius: '0.5rem'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Conversions
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                  {selectedCampaign.performance.conversions}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {selectedCampaign.performance.conversionRate.toFixed(1)}% CVR
                </p>
              </div>
              
              <div style={{
                padding: '1rem',
                background: '#0f172a',
                borderRadius: '0.5rem'
              }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Customer Acquisition
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                  ${selectedCampaign.performance.cac.toFixed(0)}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  CAC vs ${selectedCampaign.performance.ltv.toFixed(0)} LTV
                </p>
              </div>
            </div>
          </div>

          {/* Channel Performance */}
          <div style={adminStyles.card}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>Channel Performance</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedCampaign.channels.map((channel, index) => {
                const getChannelIcon = () => {
                  switch(channel.type) {
                    case 'email': return <Mail size={20} />;
                    case 'paid-social': return <Facebook size={20} />;
                    case 'paid-search': return <Globe size={20} />;
                    default: return <Zap size={20} />;
                  }
                };
                
                return (
                  <div key={index} style={{
                    padding: '1rem',
                    background: '#1e293b',
                    borderRadius: '0.5rem',
                    border: '1px solid #334155'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          padding: '0.5rem',
                          background: '#334155',
                          borderRadius: '0.5rem'
                        }}>
                          {getChannelIcon()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 'bold' }}>
                            {channel.platform || channel.type.replace('-', ' ').toUpperCase()}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            ${channel.spent.toLocaleString()} / ${channel.budget.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                          {channel.metrics.revenue ? 
                            `${((channel.metrics.revenue / channel.spent) || 0).toFixed(1)}x` : 
                            '—'
                          }
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ROAS</p>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '1rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid #334155'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Impressions</p>
                        <p style={{ fontWeight: 'bold' }}>
                          {channel.metrics.impressions?.toLocaleString() || '—'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Clicks</p>
                        <p style={{ fontWeight: 'bold' }}>
                          {channel.metrics.clicks?.toLocaleString() || '—'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Conversions</p>
                        <p style={{ fontWeight: 'bold' }}>
                          {channel.metrics.conversions || '—'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Revenue</p>
                        <p style={{ fontWeight: 'bold', color: '#10b981' }}>
                          ${channel.metrics.revenue?.toLocaleString() || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals Progress */}
          <div style={adminStyles.card}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>Campaign Goals</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {selectedCampaign.goals.map((goal, index) => {
                const progress = (goal.current / goal.target) * 100;
                const isComplete = progress >= 100;
                
                return (
                  <div key={index} style={{
                    padding: '1rem',
                    background: '#1e293b',
                    borderRadius: '0.5rem',
                    border: `2px solid ${isComplete ? '#10b981' : '#334155'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <p style={{ fontWeight: 'bold' }}>{goal.metric}</p>
                      {isComplete && <CheckCircle size={18} style={{ color: '#10b981' }} />}
                    </div>
                    
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {goal.unit === '$' && '$'}{goal.current.toLocaleString()}{goal.unit === 'x' && 'x'}
                      <span style={{ fontSize: '0.875rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                        / {goal.unit === '$' && '$'}{goal.target.toLocaleString()}{goal.unit === 'x' && 'x'}
                      </span>
                    </p>
                    
                    <div style={{
                      height: '8px',
                      background: '#0f172a',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(progress, 100)}%`,
                        height: '100%',
                        background: isComplete ? '#10b981' : '#f97316',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      {progress.toFixed(0)}% complete
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAttributionAnalysis = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      {/* Conversion Paths Visualization */}
      <div style={adminStyles.card}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Multi-Touch Attribution Analysis
        </h3>
        
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            Tracking {conversionPaths.length} conversion paths across all channels
          </p>
          
          {/* Attribution Model Selector */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            {['last-click', 'first-click', 'linear', 'data-driven'].map(model => (
              <button
                key={model}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#1e293b',
                  border: '2px solid #334155',
                  borderRadius: '0.5rem',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {model.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Sankey Diagram Placeholder */}
        <div style={{
          background: '#0f172a',
          borderRadius: '0.5rem',
          padding: '2rem',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <GitBranch size={48} style={{ color: '#64748b', marginBottom: '1rem' }} />
          <p style={{ color: '#94a3b8', textAlign: 'center' }}>
            Customer Journey Visualization
          </p>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
            Email → Social → Search → Purchase (45%)
          </p>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Direct → Email → Purchase (23%)
          </p>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Social → Retargeting → Purchase (18%)
          </p>
        </div>

        {/* Channel Attribution */}
        <div style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          {[
            { channel: 'Email', value: 34, color: '#10b981' },
            { channel: 'Paid Social', value: 28, color: '#3b82f6' },
            { channel: 'Organic', value: 22, color: '#8b5cf6' },
            { channel: 'Direct', value: 16, color: '#f59e0b' }
          ].map((channel, index) => (
            <div key={index} style={{
              padding: '1rem',
              background: '#1e293b',
              borderRadius: '0.5rem',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                {channel.channel}
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: channel.color }}>
                {channel.value}%
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                attribution
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* UTM Link Generator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={adminStyles.card}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>
            UTM Link Builder
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={adminStyles.label}>Base URL</label>
              <input
                type="text"
                placeholder="https://fulluproar.com/games/fugly"
                style={adminStyles.input}
              />
            </div>
            
            <div>
              <label style={adminStyles.label}>Campaign</label>
              <input
                type="text"
                placeholder="holiday-sale-2024"
                style={adminStyles.input}
              />
            </div>
            
            <div>
              <label style={adminStyles.label}>Source</label>
              <select style={adminStyles.input}>
                <option>facebook</option>
                <option>google</option>
                <option>email</option>
                <option>instagram</option>
                <option>tiktok</option>
              </select>
            </div>
            
            <div>
              <label style={adminStyles.label}>Medium</label>
              <select style={adminStyles.input}>
                <option>cpc</option>
                <option>email</option>
                <option>social</option>
                <option>organic</option>
                <option>referral</option>
              </select>
            </div>
            
            <button style={{
              ...adminStyles.button,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <Link2 size={18} />
              Generate Link
            </button>
            
            <div style={{
              padding: '1rem',
              background: '#0f172a',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              wordBreak: 'break-all'
            }}>
              <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Generated URL:</p>
              <p style={{ color: '#10b981' }}>
                https://fulluproar.com/games/fugly?utm_campaign=holiday-sale&utm_source=facebook&utm_medium=cpc
              </p>
              <button style={{
                ...adminStyles.secondaryButton,
                marginTop: '1rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Copy size={16} />
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>

        {/* Pixel Events Stream */}
        <div style={adminStyles.card}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Live Pixel Events
          </h3>
          
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {[
              { event: 'PageView', source: 'Facebook', value: null, time: '2 min ago' },
              { event: 'AddToCart', source: 'Google', value: 89.99, time: '5 min ago' },
              { event: 'Purchase', source: 'Email', value: 234.50, time: '12 min ago' },
              { event: 'ViewContent', source: 'Instagram', value: null, time: '15 min ago' },
              { event: 'InitiateCheckout', source: 'Facebook', value: 156.00, time: '23 min ago' }
            ].map((event, index) => (
              <div key={index} style={{
                padding: '0.75rem',
                borderLeft: '2px solid #3b82f6',
                marginBottom: '0.5rem',
                background: 'rgba(59, 130, 246, 0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{event.event}</p>
                  {event.value && (
                    <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.875rem' }}>
                      ${event.value}
                    </p>
                  )}
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {event.source} • {event.time}
                </p>
              </div>
            ))}
          </div>
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
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Marketing War Room</h1>
          <p style={{ color: '#94a3b8' }}>
            Plan, execute, and measure multi-channel campaigns with full attribution
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              ...adminStyles.input,
              width: 'auto'
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Plus size={18} />
            New Campaign
          </button>
        </div>
      </div>

      {/* Performance Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: 'Active Campaigns', value: '4', change: '+2', color: '#3b82f6', icon: <Target size={20} /> },
          { label: 'Total Spend', value: '$12,456', change: '+23%', color: '#f97316', icon: <DollarSign size={20} /> },
          { label: 'Avg ROAS', value: '4.2x', change: '+0.5x', color: '#10b981', icon: <TrendingUp size={20} /> },
          { label: 'Total Conversions', value: '567', change: '+89', color: '#8b5cf6', icon: <ShoppingCart size={20} /> },
          { label: 'Avg CAC', value: '$24', change: '-$3', color: '#ec4899', icon: <Users size={20} /> },
          { label: 'Attribution Score', value: '92%', change: '+5%', color: '#06b6d4', icon: <Brain size={20} /> }
        ].map((metric, index) => (
          <div key={index} style={{
            ...adminStyles.card,
            padding: '1.25rem',
            borderLeft: `3px solid ${metric.color}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  {metric.label}
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: metric.color }}>
                  {metric.value}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                  {metric.change} vs last period
                </p>
              </div>
              <div style={{
                padding: '0.5rem',
                background: `${metric.color}20`,
                borderRadius: '0.5rem'
              }}>
                {React.cloneElement(metric.icon, { style: { color: metric.color } })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #334155'
      }}>
        {[
          { id: 'planner', label: 'Campaign Planner', icon: <Calendar size={18} /> },
          { id: 'attribution', label: 'Attribution & Tracking', icon: <GitBranch size={18} /> },
          { id: 'intelligence', label: 'Competitive Intel', icon: <Brain size={18} /> },
          { id: 'experiments', label: 'A/B Experiments', icon: <Zap size={18} /> }
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

      {/* Tab Content */}
      {activeTab === 'planner' && renderCampaignPlanner()}
      {activeTab === 'attribution' && renderAttributionAnalysis()}
    </div>
  );
}