'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Download, Mail, MessageSquare, Phone,
  Calendar, DollarSign, Package, Star, TrendingUp, AlertCircle,
  Clock, MapPin, CreditCard, ShoppingBag, Tag, Award, Heart,
  UserCheck, UserX, Send, Edit2, MoreVertical, ChevronDown
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  lastOrderDate?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lifetime: number;
  segment: string;
  tags: string[];
  riskScore: number;
  loyaltyPoints: number;
  preferredProducts: string[];
  communicationPreference: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
}

interface CustomerDetailProps {
  customer: Customer;
  onClose: () => void;
  onUpdate: (customer: Customer) => void;
}

function CustomerDetail({ customer, onClose, onUpdate }: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  
  const getRiskColor = (score: number) => {
    if (score < 30) return '#10b981';
    if (score < 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '600px',
      height: '100vh',
      background: '#1e293b',
      boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      <div style={{
        padding: '2rem',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {customer.name}
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                <Mail size={14} /> {customer.email}
              </span>
              {customer.phone && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                  <Phone size={14} /> {customer.phone}
                </span>
              )}
              {customer.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8' }}>
                  <MapPin size={14} /> {customer.location.city}, {customer.location.state}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={adminStyles.iconButton}>✕</button>
        </div>

        {/* Customer Score Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <div style={{
            background: '#0f172a',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <DollarSign size={20} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Lifetime Value</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
              ${customer.lifetime.toFixed(2)}
            </p>
          </div>
          
          <div style={{
            background: '#0f172a',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <Package size={20} style={{ color: '#3b82f6', margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Orders</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{customer.totalOrders}</p>
          </div>
          
          <div style={{
            background: '#0f172a',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <Award size={20} style={{ color: '#f59e0b', margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Loyalty Points</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {customer.loyaltyPoints}
            </p>
          </div>
          
          <div style={{
            background: '#0f172a',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            <AlertCircle size={20} style={{ 
              color: getRiskColor(customer.riskScore), 
              margin: '0 auto 0.5rem' 
            }} />
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Risk Score</p>
            <p style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              color: getRiskColor(customer.riskScore)
            }}>
              {customer.riskScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #334155',
        background: '#0f172a'
      }}>
        {['overview', 'orders', 'communication', 'notes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 1.5rem',
              background: activeTab === tab ? '#1e293b' : 'transparent',
              border: 'none',
              color: activeTab === tab ? '#FF8200' : '#94a3b8',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'capitalize',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #FF8200' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '2rem' }}>
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Customer Segment</h3>
              <div style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(135deg, #7D55C7 0%, #6366f1 100%)',
                borderRadius: '50px',
                fontWeight: 'bold'
              }}>
                {customer.segment}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Tags</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {customer.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '0.25rem 0.75rem',
                    background: '#334155',
                    borderRadius: '50px',
                    fontSize: '0.875rem'
                  }}>
                    {tag}
                  </span>
                ))}
                <button style={{
                  padding: '0.25rem 0.75rem',
                  background: 'transparent',
                  border: '1px dashed #64748b',
                  borderRadius: '50px',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}>
                  + Add tag
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Preferred Products</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {customer.preferredProducts.map(product => (
                  <li key={product} style={{
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <ShoppingBag size={16} style={{ color: '#94a3b8' }} />
                    {product}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'communication' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button style={{
                  ...adminStyles.button,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <Mail size={18} />
                  Send Email
                </button>
                <button style={{
                  ...adminStyles.secondaryButton,
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <MessageSquare size={18} />
                  Send SMS
                </button>
              </div>
            </div>

            <div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Communication History</h3>
              <div style={{ 
                background: '#0f172a',
                borderRadius: '0.5rem',
                padding: '1rem'
              }}>
                <p style={{ color: '#64748b', textAlign: 'center' }}>
                  No communication history yet
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Customer Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this customer..."
              style={{
                ...adminStyles.input,
                width: '100%',
                minHeight: '150px',
                resize: 'vertical'
              }}
            />
            <button style={{
              ...adminStyles.button,
              marginTop: '1rem'
            }}>
              Save Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerManagement({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, selectedSegment]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/customers');
      const data = await response.json();

      // Map real customer data - enhanced fields will be populated when we have order data
      const mappedCustomers = Array.isArray(data) ? data.map((user: any) => ({
        id: user.id,
        name: user.name || 'Unknown Customer',
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
        lastOrderDate: user.lastOrderDate || null,
        totalOrders: user.orderCount || 0,
        totalSpent: user.totalSpent || 0,
        averageOrderValue: user.orderCount > 0 ? (user.totalSpent || 0) / user.orderCount : 0,
        lifetime: user.totalSpent || 0,
        segment: 'New', // Segmentation feature coming soon
        tags: [],
        riskScore: 0,
        loyaltyPoints: 0,
        preferredProducts: [],
        communicationPreference: 'email',
        location: undefined
      })) : [];

      setCustomers(mappedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];
    
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSegment !== 'all') {
      filtered = filtered.filter(customer => customer.segment === selectedSegment);
    }
    
    setFilteredCustomers(filtered);
  };

  const segments = [
    { value: 'all', label: 'All Customers', count: customers.length },
    { value: 'Champions', label: 'Champions', count: customers.filter(c => c.segment === 'Champions').length },
    { value: 'Loyal', label: 'Loyal', count: customers.filter(c => c.segment === 'Loyal').length },
    { value: 'Potential', label: 'Potential', count: customers.filter(c => c.segment === 'Potential').length },
    { value: 'New', label: 'New', count: customers.filter(c => c.segment === 'New').length },
    { value: 'At Risk', label: 'At Risk', count: customers.filter(c => c.segment === 'At Risk').length },
  ];

  const getSegmentColor = (segment: string) => {
    switch(segment) {
      case 'Champions': return '#10b981';
      case 'Loyal': return '#3b82f6';
      case 'Potential': return '#7D55C7';
      case 'New': return '#f59e0b';
      case 'At Risk': return '#ef4444';
      default: return '#94a3b8';
    }
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
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Customer Management</h1>
          <p style={{ color: '#94a3b8' }}>
            {customers.length} total customers • ${customers.reduce((sum, c) => sum + c.lifetime, 0).toFixed(0)} total lifetime value
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button style={adminStyles.secondaryButton}>
            <Download size={18} />
            Export
          </button>
          <button 
            style={adminStyles.button}
            onClick={() => onNavigate({ type: 'email-campaign' }, 'Email Campaign')}
          >
            <Mail size={18} />
            Email Campaign
          </button>
        </div>
      </div>

      {/* Segment Tabs */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        overflowX: 'auto'
      }}>
        {segments.map(segment => (
          <button
            key={segment.value}
            onClick={() => setSelectedSegment(segment.value)}
            style={{
              padding: '0.75rem 1.5rem',
              background: selectedSegment === segment.value ? '#1e293b' : 'transparent',
              border: `2px solid ${selectedSegment === segment.value ? getSegmentColor(segment.value) : '#334155'}`,
              borderRadius: '0.5rem',
              color: selectedSegment === segment.value ? getSegmentColor(segment.value) : '#94a3b8',
              fontWeight: selectedSegment === segment.value ? 'bold' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {segment.label}
            <span style={{
              marginLeft: '0.5rem',
              background: selectedSegment === segment.value ? getSegmentColor(segment.value) : '#334155',
              color: selectedSegment === segment.value ? 'white' : '#94a3b8',
              padding: '0.125rem 0.5rem',
              borderRadius: '50px',
              fontSize: '0.75rem'
            }}>
              {segment.count}
            </span>
          </button>
        ))}
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
            placeholder="Search customers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              ...adminStyles.input,
              width: '100%',
              paddingLeft: '3rem'
            }}
          />
        </div>
        
        <button style={adminStyles.secondaryButton}>
          <Filter size={18} />
          More Filters
        </button>
      </div>

      {/* Customer Table */}
      <div style={adminStyles.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #334155' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8' }}>Customer</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8' }}>Segment</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Orders</th>
              <th style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>Lifetime Value</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Risk</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr 
                key={customer.id}
                style={{ 
                  borderBottom: '1px solid #334155',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onClick={() => setSelectedCustomer(customer)}
              >
                <td style={{ padding: '1rem' }}>
                  <div>
                    <p style={{ fontWeight: 'bold' }}>{customer.name}</p>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{customer.email}</p>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: `${getSegmentColor(customer.segment)}20`,
                    color: getSegmentColor(customer.segment),
                    borderRadius: '50px',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    {customer.segment}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  {customer.totalOrders}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
                  ${customer.lifetime.toFixed(2)}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '8px',
                    background: '#334155',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    margin: '0 auto'
                  }}>
                    <div style={{
                      width: `${customer.riskScore}%`,
                      height: '100%',
                      background: customer.riskScore < 30 ? '#10b981' : 
                                  customer.riskScore < 70 ? '#f59e0b' : '#ef4444'
                    }} />
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      style={adminStyles.iconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Send email
                      }}
                    >
                      <Mail size={18} />
                    </button>
                    <button 
                      style={adminStyles.iconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(customer);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Sidebar */}
      {selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={(updated) => {
            setCustomers(customers.map(c => c.id === updated.id ? updated : c));
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}