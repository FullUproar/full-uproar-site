'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, Package, ShoppingCart, TrendingUp, Users,
  FileText, DollarSign, Truck, Calendar, BarChart3,
  Download, Upload, Send, Check, X, AlertCircle,
  Clock, Star, Award, Shield, CreditCard, Globe,
  Phone, Mail, MapPin, Hash, ChevronRight, Plus,
  Edit, Eye, Copy, Link, RefreshCw, Filter, Search, User,
  CheckCircle
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface WholesaleAccount {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  taxId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  creditLimit: number;
  creditUsed: number;
  paymentTerms: 'net15' | 'net30' | 'net45' | 'net60' | 'prepaid';
  discountRate: number;
  volumeCommitment?: number;
  accountManager?: string;
  onboardingDate: Date;
  lastOrderDate?: Date;
  totalOrders: number;
  totalRevenue: number;
  documents: Array<{
    type: 'w9' | 'resale_cert' | 'credit_app' | 'agreement';
    url: string;
    uploadedAt: Date;
    verified: boolean;
  }>;
}

interface WholesaleProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  retailPrice: number;
  wholesalePricing: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  moq: number; // Minimum Order Quantity
  casePackSize: number;
  stockAvailable: number;
  leadTime: number; // days
  discontinued: boolean;
}

interface WholesaleOrder {
  id: string;
  accountId: string;
  accountName: string;
  orderNumber: string;
  poNumber?: string;
  status: 'pending' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  dates: {
    ordered: Date;
    approved?: Date;
    shipped?: Date;
    delivered?: Date;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  trackingNumber?: string;
  notes?: string;
}

export default function B2BPortal({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'catalog' | 'orders' | 'applications'>('dashboard');
  const [accounts, setAccounts] = useState<WholesaleAccount[]>([]);
  const [products, setProducts] = useState<WholesaleProduct[]>([]);
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<WholesaleAccount | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Mock data
  useEffect(() => {
    const mockAccounts: WholesaleAccount[] = [
      {
        id: '1',
        companyName: 'GameStop Corp',
        contactName: 'John Smith',
        email: 'purchasing@gamestop.com',
        phone: '555-0100',
        website: 'https://gamestop.com',
        taxId: 'XX-XXXXXXX',
        address: {
          street: '625 Westport Parkway',
          city: 'Grapevine',
          state: 'TX',
          zip: '76051',
          country: 'US'
        },
        tier: 'platinum',
        status: 'active',
        creditLimit: 50000,
        creditUsed: 12500,
        paymentTerms: 'net45',
        discountRate: 45,
        volumeCommitment: 100000,
        accountManager: 'Sarah Johnson',
        onboardingDate: new Date('2023-01-15'),
        lastOrderDate: new Date('2024-11-28'),
        totalOrders: 47,
        totalRevenue: 284920,
        documents: [
          { type: 'w9', url: '#', uploadedAt: new Date('2023-01-14'), verified: true },
          { type: 'resale_cert', url: '#', uploadedAt: new Date('2023-01-14'), verified: true }
        ]
      },
      {
        id: '2',
        companyName: 'Barnes & Noble',
        contactName: 'Emily Chen',
        email: 'games@bn.com',
        phone: '555-0101',
        taxId: 'XX-XXXXXXX',
        address: {
          street: '122 Fifth Avenue',
          city: 'New York',
          state: 'NY',
          zip: '10011',
          country: 'US'
        },
        tier: 'gold',
        status: 'active',
        creditLimit: 35000,
        creditUsed: 8200,
        paymentTerms: 'net30',
        discountRate: 40,
        onboardingDate: new Date('2023-03-22'),
        lastOrderDate: new Date('2024-11-15'),
        totalOrders: 28,
        totalRevenue: 156890,
        documents: [
          { type: 'w9', url: '#', uploadedAt: new Date('2023-03-20'), verified: true },
          { type: 'credit_app', url: '#', uploadedAt: new Date('2023-03-20'), verified: true }
        ]
      }
    ];

    const mockProducts: WholesaleProduct[] = [
      {
        id: '1',
        name: 'Chaos & Mayhem - Deluxe Edition',
        sku: 'CM-DELUXE-001',
        category: 'Board Games',
        retailPrice: 89.99,
        wholesalePricing: {
          bronze: 54.00,
          silver: 49.50,
          gold: 45.00,
          platinum: 40.50
        },
        moq: 6,
        casePackSize: 6,
        stockAvailable: 420,
        leadTime: 14,
        discontinued: false
      },
      {
        id: '2',
        name: 'Fugly Dice Set',
        sku: 'DICE-FUGLY-001',
        category: 'Accessories',
        retailPrice: 19.99,
        wholesalePricing: {
          bronze: 12.00,
          silver: 11.00,
          gold: 10.00,
          platinum: 9.00
        },
        moq: 12,
        casePackSize: 12,
        stockAvailable: 1200,
        leadTime: 7,
        discontinued: false
      }
    ];

    const mockOrders: WholesaleOrder[] = [
      {
        id: '1',
        accountId: '1',
        accountName: 'GameStop Corp',
        orderNumber: 'WO-2024-1128',
        poNumber: 'GS-PO-98765',
        status: 'processing',
        items: [
          { productId: '1', name: 'Chaos & Mayhem', quantity: 48, unitPrice: 40.50, total: 1944.00 },
          { productId: '2', name: 'Fugly Dice', quantity: 144, unitPrice: 9.00, total: 1296.00 }
        ],
        totals: {
          subtotal: 3240.00,
          discount: 0,
          tax: 0,
          shipping: 125.00,
          total: 3365.00
        },
        dates: {
          ordered: new Date('2024-11-28'),
          approved: new Date('2024-11-28')
        },
        shippingAddress: {
          street: '625 Westport Parkway',
          city: 'Grapevine',
          state: 'TX',
          zip: '76051'
        }
      }
    ];

    setAccounts(mockAccounts);
    setProducts(mockProducts);
    setOrders(mockOrders);
  }, []);

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700',
      platinum: '#e5e4e2'
    };
    return colors[tier] || '#64748b';
  };

  const getTierBenefits = (tier: string) => {
    const benefits: Record<string, Array<string>> = {
      bronze: ['30% discount', 'Net 15 terms', '$5,000 credit limit'],
      silver: ['35% discount', 'Net 30 terms', '$15,000 credit limit', 'Dedicated support'],
      gold: ['40% discount', 'Net 45 terms', '$35,000 credit limit', 'Priority shipping', 'Early access'],
      platinum: ['45% discount', 'Net 60 terms', '$50,000+ credit', 'White glove service', 'Exclusives', 'Co-op marketing']
    };
    return benefits[tier] || [];
  };

  const renderDashboard = () => {
    const stats = {
      activeAccounts: accounts.filter(a => a.status === 'active').length,
      pendingApprovals: accounts.filter(a => a.status === 'pending').length,
      monthlyRevenue: orders.reduce((sum, o) => o.dates.ordered.getMonth() === new Date().getMonth() ? sum + o.totals.total : sum, 0),
      openOrders: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length
    };

    return (
      <div>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <Building size={24} style={{ color: '#8b5cf6' }} />
              <span style={{ color: '#10b981', fontSize: '12px' }}>+2 this month</span>
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', margin: '10px 0' }}>
              {stats.activeAccounts}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Active Accounts</p>
          </div>

          <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <Clock size={24} style={{ color: '#fbbf24' }} />
              <AlertCircle size={16} style={{ color: '#f59e0b' }} />
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24', margin: '10px 0' }}>
              {stats.pendingApprovals}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Pending Approvals</p>
          </div>

          <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <DollarSign size={24} style={{ color: '#10b981' }} />
              <TrendingUp size={16} style={{ color: '#10b981' }} />
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}>
              ${stats.monthlyRevenue.toLocaleString()}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Monthly B2B Revenue</p>
          </div>

          <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <Package size={24} style={{ color: '#3b82f6' }} />
              <span style={{ color: '#3b82f6', fontSize: '12px' }}>{stats.openOrders} active</span>
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6', margin: '10px 0' }}>
              {orders.length}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Total Orders</p>
          </div>
        </div>

        {/* Tier Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={adminStyles.card}>
            <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Account Tier Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {['platinum', 'gold', 'silver', 'bronze'].map(tier => {
                const count = accounts.filter(a => a.tier === tier).length;
                const percentage = accounts.length > 0 ? (count / accounts.length) * 100 : 0;
                return (
                  <div key={tier}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          background: getTierColor(tier) 
                        }} />
                        <span style={{ color: '#fde68a', textTransform: 'capitalize' }}>{tier}</span>
                      </div>
                      <span style={{ color: '#94a3b8' }}>{count} accounts</span>
                    </div>
                    <div style={{ 
                      height: '6px', 
                      background: 'rgba(148, 163, 184, 0.1)', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: getTierColor(tier),
                        transition: 'width 0.5s'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={adminStyles.card}>
            <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fde68a', fontSize: '14px' }}>GameStop order shipped</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>2 hours ago</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Plus size={20} style={{ color: '#3b82f6' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fde68a', fontSize: '14px' }}>New application: Target Corp</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>5 hours ago</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <DollarSign size={20} style={{ color: '#fbbf24' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fde68a', fontSize: '14px' }}>Barnes & Noble payment received</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>Yesterday</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAccounts = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...adminStyles.sectionTitle, margin: 0 }}>Wholesale Accounts</h2>
        <button 
          onClick={() => setShowApplicationModal(true)}
          style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          <Plus size={16} style={{ marginRight: '8px' }} />
          Add Account
        </button>
      </div>

      {/* Account Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {accounts.map(account => (
          <div 
            key={account.id} 
            style={{ 
              ...adminStyles.card,
              cursor: 'pointer',
              border: '2px solid transparent',
              transition: 'all 0.3s'
            }}
            onClick={() => setSelectedAccount(account)}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#f97316'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            {/* Account Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ color: '#fde68a', fontSize: '18px', marginBottom: '5px' }}>
                  {account.companyName}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>{account.contactName}</p>
              </div>
              <div style={{ 
                padding: '4px 12px',
                borderRadius: '20px',
                background: `${getTierColor(account.tier)}22`,
                color: getTierColor(account.tier),
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {account.tier}
              </div>
            </div>

            {/* Account Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Credit Available</div>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                  ${(account.creditLimit - account.creditUsed).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Payment Terms</div>
                <div style={{ color: '#e2e8f0', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {account.paymentTerms}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Total Orders</div>
                <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>{account.totalOrders}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Total Revenue</div>
                <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                  ${account.totalRevenue.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Credit Usage Bar */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                <span style={{ color: '#94a3b8' }}>Credit Used</span>
                <span style={{ color: '#94a3b8' }}>
                  ${account.creditUsed.toLocaleString()} / ${account.creditLimit.toLocaleString()}
                </span>
              </div>
              <div style={{ 
                height: '8px', 
                background: 'rgba(148, 163, 184, 0.1)', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(account.creditUsed / account.creditLimit) * 100}%`, 
                  height: '100%', 
                  background: account.creditUsed / account.creditLimit > 0.8 ? '#ef4444' : '#10b981'
                }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...adminStyles.button, flex: 1, padding: '8px' }}>
                <ShoppingCart size={14} style={{ marginRight: '6px' }} />
                New Order
              </button>
              <button style={{ ...adminStyles.iconButton, color: '#3b82f6' }}>
                <Eye size={16} />
              </button>
              <button style={{ ...adminStyles.iconButton, color: '#8b5cf6' }}>
                <Edit size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '2px solid rgba(249, 115, 22, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: '#fde68a', fontSize: '24px' }}>
                {selectedAccount.companyName}
              </h2>
              <button 
                onClick={() => setSelectedAccount(null)}
                style={adminStyles.iconButton}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tier Benefits */}
            <div style={{ 
              padding: '15px',
              background: `${getTierColor(selectedAccount.tier)}11`,
              border: `2px solid ${getTierColor(selectedAccount.tier)}44`,
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                <Award size={24} style={{ color: getTierColor(selectedAccount.tier) }} />
                <span style={{ 
                  color: getTierColor(selectedAccount.tier),
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {selectedAccount.tier} Tier Benefits
                </span>
              </div>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {getTierBenefits(selectedAccount.tier).map((benefit, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} style={{ color: '#10b981' }} />
                    <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <h3 style={{ color: '#fdba74', fontSize: '16px', marginBottom: '15px' }}>Contact Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={16} style={{ color: '#64748b' }} />
                    <span style={{ color: '#e2e8f0' }}>{selectedAccount.contactName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Mail size={16} style={{ color: '#64748b' }} />
                    <span style={{ color: '#e2e8f0' }}>{selectedAccount.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Phone size={16} style={{ color: '#64748b' }} />
                    <span style={{ color: '#e2e8f0' }}>{selectedAccount.phone}</span>
                  </div>
                  {selectedAccount.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Globe size={16} style={{ color: '#64748b' }} />
                      <a href={selectedAccount.website} style={{ color: '#3b82f6' }} target="_blank">
                        {selectedAccount.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ color: '#fdba74', fontSize: '16px', marginBottom: '15px' }}>Billing Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={16} style={{ color: '#64748b' }} />
                    <div style={{ color: '#e2e8f0' }}>
                      <div>{selectedAccount.address.street}</div>
                      <div>{selectedAccount.address.city}, {selectedAccount.address.state} {selectedAccount.address.zip}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Hash size={16} style={{ color: '#64748b' }} />
                    <span style={{ color: '#e2e8f0' }}>Tax ID: {selectedAccount.taxId}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#fdba74', fontSize: '16px', marginBottom: '15px' }}>Account Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>Member Since</div>
                    <div style={{ color: '#e2e8f0', fontSize: '14px' }}>
                      {selectedAccount.onboardingDate.toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>Last Order</div>
                    <div style={{ color: '#e2e8f0', fontSize: '14px' }}>
                      {selectedAccount.lastOrderDate?.toLocaleDateString() || 'Never'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>Lifetime Value</div>
                    <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 'bold' }}>
                      ${selectedAccount.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>Discount Rate</div>
                    <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                      {selectedAccount.discountRate}%
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ color: '#fdba74', fontSize: '16px', marginBottom: '15px' }}>Documents</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedAccount.documents.map((doc, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '8px',
                      background: 'rgba(148, 163, 184, 0.05)',
                      borderRadius: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={16} style={{ color: '#64748b' }} />
                        <span style={{ color: '#e2e8f0', fontSize: '14px', textTransform: 'uppercase' }}>
                          {doc.type.replace('_', ' ')}
                        </span>
                      </div>
                      {doc.verified ? (
                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                      ) : (
                        <AlertCircle size={16} style={{ color: '#f59e0b' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <ShoppingCart size={16} style={{ marginRight: '8px' }} />
                Create Order
              </button>
              <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                <CreditCard size={16} style={{ marginRight: '8px' }} />
                Adjust Credit
              </button>
              <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <Award size={16} style={{ marginRight: '8px' }} />
                Upgrade Tier
              </button>
              <button style={{ ...adminStyles.button, background: 'rgba(148, 163, 184, 0.1)' }}>
                <Send size={16} style={{ marginRight: '8px' }} />
                Send Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCatalog = () => (
    <div>
      <h2 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Wholesale Catalog</h2>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {products.map(product => (
          <div key={product.id} style={adminStyles.card}>
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ color: '#fde68a', fontSize: '16px', marginBottom: '5px' }}>
                {product.name}
              </h3>
              <p style={{ color: '#64748b', fontSize: '12px' }}>SKU: {product.sku}</p>
            </div>

            {/* Pricing Tiers */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>Wholesale Pricing</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.entries(product.wholesalePricing).map(([tier, price]) => (
                  <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: getTierColor(tier), textTransform: 'capitalize' }}>{tier}:</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>${price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748b' }}>MOQ:</span>{' '}
                <span style={{ color: '#e2e8f0' }}>{product.moq} units</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Case Pack:</span>{' '}
                <span style={{ color: '#e2e8f0' }}>{product.casePackSize}</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Stock:</span>{' '}
                <span style={{ color: product.stockAvailable > 100 ? '#10b981' : '#f59e0b' }}>
                  {product.stockAvailable}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Lead Time:</span>{' '}
                <span style={{ color: '#e2e8f0' }}>{product.leadTime} days</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={adminStyles.title}>
          B2B Wholesale Portal
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Manage wholesale accounts, orders, and tiered pricing
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
          { id: 'accounts', label: 'Accounts', icon: <Building size={16} /> },
          { id: 'catalog', label: 'Catalog', icon: <Package size={16} /> },
          { id: 'orders', label: 'Orders', icon: <ShoppingCart size={16} /> },
          { id: 'applications', label: 'Applications', icon: <FileText size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              ...adminStyles.button,
              background: activeTab === tab.id ? 
                'linear-gradient(135deg, #f97316, #ea580c)' : 
                'rgba(148, 163, 184, 0.1)',
              color: activeTab === tab.id ? '#fff' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'accounts' && renderAccounts()}
      {activeTab === 'catalog' && renderCatalog()}
      {activeTab === 'orders' && (
        <div style={adminStyles.card}>
          <h3 style={adminStyles.sectionTitle}>Wholesale Orders</h3>
          <p style={{ color: '#94a3b8' }}>Order management with EDI integration and bulk processing coming soon...</p>
        </div>
      )}
      {activeTab === 'applications' && (
        <div style={adminStyles.card}>
          <h3 style={adminStyles.sectionTitle}>New Applications</h3>
          <p style={{ color: '#94a3b8' }}>Review and approve wholesale account applications...</p>
        </div>
      )}
    </div>
  );
}