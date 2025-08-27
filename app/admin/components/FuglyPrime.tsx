'use client';

import React, { useState, useEffect } from 'react';
import { 
  Crown, Gift, Users, DollarSign, TrendingUp, Award, Star,
  Zap, Package, Percent, UserPlus, Share2, Trophy, Target,
  Clock, Calendar, ChevronUp, ArrowUpRight, ArrowDownRight,
  Edit2, Save, X, Plus, Copy, Mail, MessageSquare, Bell,
  ShoppingBag, Heart, Sparkles, Flame, Shield, Diamond, Download
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Subscriber {
  id: string;
  userId: string;
  name: string;
  email: string;
  tier: 'rookie' | 'player' | 'champion' | 'master' | 'fugly_prime';
  status: 'active' | 'paused' | 'cancelled';
  joinedAt: Date;
  nextBillingDate: Date;
  lifetimeValue: number;
  monthlyValue: number;
  boxesReceived: number;
  points: number;
  referrals: number;
  streak: number; // months active
  perks: string[];
}

interface LoyaltyTier {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  pointsRequired: number;
  perks: string[];
  discountPercent: number;
  freeShippingThreshold: number;
}

interface Affiliate {
  id: string;
  userId: string;
  name: string;
  email: string;
  code: string;
  status: 'active' | 'pending' | 'suspended';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  conversionRate: number;
  clicks: number;
  conversions: number;
  lastSaleDate?: Date;
  socialReach?: number;
}

interface ChaosBox {
  id: string;
  month: string;
  theme: string;
  items: Array<{
    name: string;
    type: 'exclusive' | 'early-access' | 'limited' | 'surprise';
    retailValue: number;
  }>;
  totalValue: number;
  shipped: number;
  feedback: {
    rating: number;
    reviews: number;
  };
}

export default function FuglyPrime({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'subscribers' | 'loyalty' | 'affiliates' | 'boxes'>('overview');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [chaosBoxes, setChaosBoxes] = useState<ChaosBox[]>([]);
  
  const loyaltyTiers: LoyaltyTier[] = [
    {
      id: 'rookie',
      name: 'Chaos Rookie',
      icon: <Star size={20} />,
      color: '#94a3b8',
      pointsRequired: 0,
      perks: ['Earn 1 point per $1', 'Birthday bonus', 'Early sale access'],
      discountPercent: 0,
      freeShippingThreshold: 75
    },
    {
      id: 'player',
      name: 'Chaos Player',
      icon: <Zap size={20} />,
      color: '#3b82f6',
      pointsRequired: 500,
      perks: ['Earn 1.25 points per $1', '5% off all orders', 'Free shipping over $50'],
      discountPercent: 5,
      freeShippingThreshold: 50
    },
    {
      id: 'champion',
      name: 'Chaos Champion',
      icon: <Trophy size={20} />,
      color: '#8b5cf6',
      pointsRequired: 2000,
      perks: ['Earn 1.5 points per $1', '10% off all orders', 'Free shipping over $25', 'Exclusive products'],
      discountPercent: 10,
      freeShippingThreshold: 25
    },
    {
      id: 'master',
      name: 'Fugly Master',
      icon: <Crown size={20} />,
      color: '#f59e0b',
      pointsRequired: 5000,
      perks: ['Earn 2 points per $1', '15% off all orders', 'Free shipping always', 'VIP support', 'Beta access'],
      discountPercent: 15,
      freeShippingThreshold: 0
    },
    {
      id: 'fugly_prime',
      name: 'FUGLY PRIME',
      icon: <Diamond size={20} />,
      color: '#f97316',
      pointsRequired: 0, // Subscription only
      perks: [
        'Everything in Master tier',
        'Monthly Chaos Box ($50+ value)',
        '20% off everything',
        'Free shipping always',
        'Exclusive Prime-only products',
        'Early access to everything',
        'Double points on all purchases',
        'Free returns',
        'Concierge support'
      ],
      discountPercent: 20,
      freeShippingThreshold: 0
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Mock data for demo
    const mockSubscribers: Subscriber[] = [
      {
        id: '1',
        userId: 'user1',
        name: 'John Chaos',
        email: 'john@chaos.com',
        tier: 'fugly_prime',
        status: 'active',
        joinedAt: new Date('2024-01-15'),
        nextBillingDate: new Date('2025-02-15'),
        lifetimeValue: 847.50,
        monthlyValue: 29.99,
        boxesReceived: 11,
        points: 8475,
        referrals: 3,
        streak: 11,
        perks: loyaltyTiers[4].perks
      },
      {
        id: '2',
        userId: 'user2',
        name: 'Sarah Mayhem',
        email: 'sarah@mayhem.com',
        tier: 'champion',
        status: 'active',
        joinedAt: new Date('2024-06-01'),
        nextBillingDate: new Date('2025-02-01'),
        lifetimeValue: 456.78,
        monthlyValue: 0,
        boxesReceived: 0,
        points: 2340,
        referrals: 1,
        streak: 0,
        perks: loyaltyTiers[2].perks
      }
    ];

    const mockAffiliates: Affiliate[] = [
      {
        id: '1',
        userId: 'aff1',
        name: 'Gaming Guru',
        email: 'guru@gaming.com',
        code: 'GURU15',
        status: 'active',
        tier: 'gold',
        totalSales: 12456.78,
        totalCommission: 1868.52,
        pendingCommission: 234.50,
        conversionRate: 4.2,
        clicks: 3456,
        conversions: 145,
        lastSaleDate: new Date(),
        socialReach: 45000
      },
      {
        id: '2',
        userId: 'aff2',
        name: 'Board Game Betty',
        email: 'betty@boardgames.com',
        code: 'BETTY10',
        status: 'active',
        tier: 'silver',
        totalSales: 5678.90,
        totalCommission: 851.84,
        pendingCommission: 125.00,
        conversionRate: 3.1,
        clicks: 1890,
        conversions: 59,
        lastSaleDate: new Date(),
        socialReach: 12000
      }
    ];

    const mockBoxes: ChaosBox[] = [
      {
        id: '1',
        month: 'January 2025',
        theme: 'New Year Chaos',
        items: [
          { name: 'Exclusive Fugly Dice Set', type: 'exclusive', retailValue: 15.99 },
          { name: 'Chaos Cards Mini Expansion', type: 'early-access', retailValue: 9.99 },
          { name: 'Limited Edition Pin', type: 'limited', retailValue: 12.99 },
          { name: 'Mystery Item', type: 'surprise', retailValue: 19.99 }
        ],
        totalValue: 58.96,
        shipped: 234,
        feedback: { rating: 4.7, reviews: 89 }
      },
      {
        id: '2',
        month: 'December 2024',
        theme: 'Holiday Havoc',
        items: [
          { name: 'Festive Fugly Sweater Pin', type: 'exclusive', retailValue: 14.99 },
          { name: 'Holiday Character Pack', type: 'limited', retailValue: 24.99 },
          { name: 'Chaos Ornament', type: 'exclusive', retailValue: 9.99 },
          { name: 'Surprise Game', type: 'surprise', retailValue: 29.99 }
        ],
        totalValue: 79.96,
        shipped: 312,
        feedback: { rating: 4.9, reviews: 156 }
      }
    ];

    setSubscribers(mockSubscribers);
    setAffiliates(mockAffiliates);
    setChaosBoxes(mockBoxes);
  };

  const getMetrics = () => {
    const activeSubscribers = subscribers.filter(s => s.status === 'active');
    const primeSubscribers = activeSubscribers.filter(s => s.tier === 'fugly_prime');
    const monthlyRecurring = primeSubscribers.length * 29.99;
    const averageLifetimeValue = subscribers.reduce((sum, s) => sum + s.lifetimeValue, 0) / subscribers.length || 0;
    const totalAffiliateRevenue = affiliates.reduce((sum, a) => sum + a.totalSales, 0);
    
    return {
      totalSubscribers: subscribers.length,
      activeSubscribers: activeSubscribers.length,
      primeMembers: primeSubscribers.length,
      monthlyRecurringRevenue: monthlyRecurring,
      averageLifetimeValue,
      totalAffiliates: affiliates.length,
      activeAffiliates: affiliates.filter(a => a.status === 'active').length,
      affiliateRevenue: totalAffiliateRevenue,
      averageCommissionRate: 15, // 15%
      churnRate: 2.3, // %
      retentionRate: 97.7 // %
    };
  };

  const metrics = getMetrics();

  const renderOverview = () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          ...adminStyles.card,
          borderLeft: '3px solid #f97316',
          background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.05) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                FUGLY PRIME Members
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f97316' }}>
                {metrics.primeMembers}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
                +23% this month
              </p>
            </div>
            <Crown size={24} style={{ color: '#f97316' }} />
          </div>
        </div>

        <div style={{
          ...adminStyles.card,
          borderLeft: '3px solid #10b981'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Monthly Recurring
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                ${metrics.monthlyRecurringRevenue.toFixed(0)}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Predictable revenue
              </p>
            </div>
            <DollarSign size={24} style={{ color: '#10b981' }} />
          </div>
        </div>

        <div style={{
          ...adminStyles.card,
          borderLeft: '3px solid #3b82f6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Avg Lifetime Value
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                ${metrics.averageLifetimeValue.toFixed(0)}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Per subscriber
              </p>
            </div>
            <TrendingUp size={24} style={{ color: '#3b82f6' }} />
          </div>
        </div>

        <div style={{
          ...adminStyles.card,
          borderLeft: '3px solid #8b5cf6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                Affiliate Revenue
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                ${(metrics.affiliateRevenue / 1000).toFixed(1)}k
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                {metrics.activeAffiliates} active partners
              </p>
            </div>
            <Users size={24} style={{ color: '#8b5cf6' }} />
          </div>
        </div>
      </div>

      {/* Subscription Growth Chart */}
      <div style={adminStyles.card}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>
          Fugly Prime Growth
        </h3>
        <div style={{
          height: '200px',
          background: '#0f172a',
          borderRadius: '0.5rem',
          padding: '1rem',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.5rem'
        }}>
          {[45, 52, 61, 73, 89, 95, 112, 134, 156, 189, 215, 234].map((value, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${(value / 234) * 100}%`,
                background: `linear-gradient(180deg, #f97316 0%, #ea580c ${100 - (value / 234) * 100}%)`,
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                minHeight: '20px'
              }}
            >
              <div style={{
                position: 'absolute',
                bottom: '-20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '0.625rem',
                color: '#64748b',
                whiteSpace: 'nowrap'
              }}>
                {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem'
      }}>
        {/* Top Affiliates */}
        <div style={adminStyles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 'bold' }}>Top Affiliates</h3>
            <button style={{
              background: 'transparent',
              border: 'none',
              color: '#3b82f6',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}>
              View all →
            </button>
          </div>
          
          {affiliates.slice(0, 5).map((affiliate, index) => (
            <div key={affiliate.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              background: '#0f172a',
              borderRadius: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#cd7f32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
                <div>
                  <p style={{ fontWeight: 'bold' }}>{affiliate.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Code: {affiliate.code}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold', color: '#10b981' }}>
                  ${affiliate.totalSales.toLocaleString()}
                </p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {affiliate.conversions} sales
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Loyalty Tier Distribution */}
        <div style={adminStyles.card}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Member Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loyaltyTiers.slice(0, 5).map(tier => {
              const memberCount = tier.id === 'fugly_prime' ? metrics.primeMembers :
                                 tier.id === 'master' ? 45 :
                                 tier.id === 'champion' ? 123 :
                                 tier.id === 'player' ? 234 :
                                 456;
              const percentage = (memberCount / 1000) * 100;
              
              return (
                <div key={tier.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ color: tier.color }}>{tier.icon}</div>
                      <span style={{ fontWeight: 'bold' }}>{tier.name}</span>
                    </div>
                    <span style={{ color: '#94a3b8' }}>{memberCount} members</span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: '#0f172a',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: tier.color
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Chaos Box */}
      <div style={adminStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 'bold' }}>This Month's Chaos Box</h3>
          <button style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Edit2 size={18} />
            Edit Box
          </button>
        </div>
        
        {chaosBoxes[0] && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 1fr',
            gap: '2rem'
          }}>
            <div style={{
              background: '#0f172a',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <Gift size={48} style={{ color: '#f97316', margin: '0 auto 1rem' }} />
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {chaosBoxes[0].month}
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                "{chaosBoxes[0].theme}"
              </p>
            </div>
            
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Box Contents</h4>
              {chaosBoxes[0].items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #334155'
                }}>
                  <div>
                    <p style={{ fontWeight: 'bold' }}>{item.name}</p>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      background: item.type === 'exclusive' ? '#f9731620' :
                                 item.type === 'early-access' ? '#3b82f620' :
                                 item.type === 'limited' ? '#8b5cf620' :
                                 '#10b98120',
                      color: item.type === 'exclusive' ? '#f97316' :
                             item.type === 'early-access' ? '#3b82f6' :
                             item.type === 'limited' ? '#8b5cf6' :
                             '#10b981',
                      borderRadius: '50px'
                    }}>
                      {item.type}
                    </span>
                  </div>
                  <p style={{ fontWeight: 'bold', color: '#10b981' }}>
                    ${item.retailValue}
                  </p>
                </div>
              ))}
            </div>
            
            <div style={{
              background: '#0f172a',
              borderRadius: '0.5rem',
              padding: '1.5rem'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Total Value
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                  ${chaosBoxes[0].totalValue}
                </p>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Subscribers
                </p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {chaosBoxes[0].shipped}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Satisfaction
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Star size={20} style={{ color: '#f59e0b' }} />
                  <span style={{ fontWeight: 'bold' }}>
                    {chaosBoxes[0].feedback.rating}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    ({chaosBoxes[0].feedback.reviews} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSubscribers = () => (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{
            padding: '0.5rem 1rem',
            background: '#1e293b',
            border: '2px solid #334155',
            borderRadius: '0.5rem',
            color: '#e2e8f0',
            cursor: 'pointer'
          }}>
            All Members ({subscribers.length})
          </button>
          <button style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(234,88,12,0.1) 100%)',
            border: '2px solid #f97316',
            borderRadius: '0.5rem',
            color: '#f97316',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            Fugly Prime ({metrics.primeMembers})
          </button>
        </div>
        
        <button style={{
          ...adminStyles.button,
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Mail size={18} />
          Email Campaign
        </button>
      </div>

      <div style={adminStyles.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155' }}>
              <th style={{ padding: '1rem', textAlign: 'left' }}>Member</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Tier</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Points</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Lifetime Value</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Streak</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(subscriber => {
              const tier = loyaltyTiers.find(t => t.id === subscriber.tier);
              
              return (
                <tr key={subscriber.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '1rem' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{subscriber.name}</p>
                      <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{subscriber.email}</p>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={{ color: tier?.color }}>{tier?.icon}</div>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: `${tier?.color}20`,
                        color: tier?.color,
                        borderRadius: '50px',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}>
                        {tier?.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
                    {subscriber.points.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>
                    ${subscriber.lifetimeValue.toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <Flame size={16} style={{ color: subscriber.streak > 6 ? '#f97316' : '#94a3b8' }} />
                      <span style={{ fontWeight: 'bold' }}>{subscriber.streak}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>mo</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: subscriber.status === 'active' ? '#10b98120' : '#94a3b820',
                      color: subscriber.status === 'active' ? '#10b981' : '#94a3b8',
                      borderRadius: '50px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {subscriber.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => setSelectedSubscriber(subscriber)}
                        style={adminStyles.iconButton}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button style={adminStyles.iconButton}>
                        <Mail size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAffiliates = () => (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Affiliate Partners
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={adminStyles.secondaryButton}>
            <Download size={18} />
            Export Report
          </button>
          <button style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <UserPlus size={18} />
            Invite Affiliate
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {affiliates.map(affiliate => (
          <div key={affiliate.id} style={{
            ...adminStyles.card,
            borderTop: `3px solid ${
              affiliate.tier === 'platinum' ? '#e5e4e2' :
              affiliate.tier === 'gold' ? '#f59e0b' :
              affiliate.tier === 'silver' ? '#94a3b8' :
              '#cd7f32'
            }`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {affiliate.name}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  {affiliate.email}
                </p>
              </div>
              <span style={{
                padding: '0.25rem 0.75rem',
                background: affiliate.status === 'active' ? '#10b98120' : '#94a3b820',
                color: affiliate.status === 'active' ? '#10b981' : '#94a3b8',
                borderRadius: '50px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {affiliate.status}
              </span>
            </div>

            <div style={{
              padding: '1rem',
              background: '#0f172a',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                    Promo Code
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 'bold', color: '#f97316' }}>
                    {affiliate.code}
                  </p>
                </div>
                <button style={{
                  ...adminStyles.iconButton,
                  color: '#3b82f6'
                }}>
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Total Sales
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                  ${affiliate.totalSales.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Commission
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
                  ${affiliate.totalCommission.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Conversion Rate
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {affiliate.conversionRate}%
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  Total Clicks
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {affiliate.clicks.toLocaleString()}
                </p>
              </div>
            </div>

            {affiliate.socialReach && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: '#1e293b',
                borderRadius: '0.5rem'
              }}>
                <Users size={16} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '0.875rem' }}>
                  Social Reach: <strong>{(affiliate.socialReach / 1000).toFixed(0)}k followers</strong>
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button style={{
                ...adminStyles.secondaryButton,
                flex: 1
              }}>
                View Details
              </button>
              {affiliate.pendingCommission > 0 && (
                <button style={{
                  ...adminStyles.button,
                  flex: 1,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}>
                  Pay ${affiliate.pendingCommission}
                </button>
              )}
            </div>
          </div>
        ))}
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
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={32} style={{ color: '#f97316' }} />
            FUGLY PRIME & Affiliates
          </h1>
          <p style={{ color: '#94a3b8' }}>
            Subscription memberships, loyalty rewards, and partner program management
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={{
            ...adminStyles.button,
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={18} />
            Launch Campaign
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: '2rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(234,88,12,0.05) 100%)',
        borderRadius: '0.5rem',
        border: '1px solid rgba(249,115,22,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} style={{ color: '#f97316' }} />
          <span style={{ fontWeight: 'bold' }}>{metrics.retentionRate}%</span>
          <span style={{ color: '#94a3b8' }}>Retention</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} style={{ color: '#10b981' }} />
          <span style={{ fontWeight: 'bold' }}>+${metrics.monthlyRecurringRevenue}</span>
          <span style={{ color: '#94a3b8' }}>MRR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} style={{ color: '#8b5cf6' }} />
          <span style={{ fontWeight: 'bold' }}>{metrics.activeAffiliates}</span>
          <span style={{ color: '#94a3b8' }}>Active Affiliates</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Gift size={20} style={{ color: '#3b82f6' }} />
          <span style={{ fontWeight: 'bold' }}>{metrics.primeMembers}</span>
          <span style={{ color: '#94a3b8' }}>Getting Monthly Boxes</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #334155'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp size={18} /> },
          { id: 'subscribers', label: 'Subscribers', icon: <Crown size={18} /> },
          { id: 'loyalty', label: 'Loyalty Tiers', icon: <Award size={18} /> },
          { id: 'affiliates', label: 'Affiliates', icon: <Users size={18} /> },
          { id: 'boxes', label: 'Chaos Boxes', icon: <Gift size={18} /> }
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
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'subscribers' && renderSubscribers()}
      {activeTab === 'affiliates' && renderAffiliates()}
    </div>
  );
}