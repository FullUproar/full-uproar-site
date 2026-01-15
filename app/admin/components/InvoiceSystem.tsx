'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FileText, Send, Download, Printer, Clock, CheckCircle,
  AlertCircle, DollarSign, Calendar, User, Building,
  Mail, Phone, MapPin, Hash, CreditCard, Copy,
  Plus, Edit, Trash2, Search, Filter, ChevronDown,
  ArrowRight, X, Eye, Link, RefreshCw, Archive,
  TrendingUp, Receipt, Banknote, Timer, AlertTriangle
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  type: 'invoice' | 'quote' | 'credit_note';
  customer: {
    id: string;
    name: string;
    email: string;
    company?: string;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
    taxId?: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    tax?: number;
  }>;
  dates: {
    issued: Date;
    due: Date;
    paid?: Date;
  };
  amounts: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paid: number;
    balance: number;
  };
  payment: {
    method?: 'credit_card' | 'ach' | 'wire' | 'check' | 'cash' | 'crypto';
    reference?: string;
    processorFee?: number;
  };
  notes?: string;
  terms?: string;
  attachments?: Array<{ name: string; url: string; }>;
  reminders?: Array<{ date: Date; sent: boolean; }>;
  recurring?: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    nextDate: Date;
    endDate?: Date;
  };
}

interface PaymentLink {
  id: string;
  invoiceId: string;
  url: string;
  expiresAt: Date;
  viewed: boolean;
  viewedAt?: Date;
}

export default function InvoiceSystem({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'customers' | 'settings'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceForm, setInvoiceForm] = useState<Partial<Invoice>>({
    type: 'invoice',
    customer: {
      id: '',
      name: '',
      email: '',
      address: { street: '', city: '', state: '', zip: '', country: 'US' }
    },
    items: [],
    amounts: { subtotal: 0, tax: 0, discount: 0, total: 0, paid: 0, balance: 0 }
  });

  // Mock data
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        number: 'INV-2024-001',
        status: 'paid',
        type: 'invoice',
        customer: {
          id: '1',
          name: 'GameStop Corp',
          email: 'accounts@gamestop.com',
          company: 'GameStop',
          address: {
            street: '625 Westport Parkway',
            city: 'Grapevine',
            state: 'TX',
            zip: '76051',
            country: 'US'
          },
          taxId: 'XX-XXXXXXX'
        },
        items: [
          { id: '1', description: 'Chaos & Mayhem - Wholesale (50 units)', quantity: 50, rate: 35.00, amount: 1750.00, tax: 127.75 },
          { id: '2', description: 'Fugly Dice Set - Wholesale (100 units)', quantity: 100, rate: 8.00, amount: 800.00, tax: 58.40 }
        ],
        dates: {
          issued: new Date('2024-11-01'),
          due: new Date('2024-11-30'),
          paid: new Date('2024-11-28')
        },
        amounts: {
          subtotal: 2550.00,
          tax: 186.15,
          discount: 0,
          total: 2736.15,
          paid: 2736.15,
          balance: 0
        },
        payment: {
          method: 'wire',
          reference: 'WIRE-238492',
          processorFee: 15.00
        },
        terms: 'Net 30'
      },
      {
        id: '2',
        number: 'INV-2024-002',
        status: 'overdue',
        type: 'invoice',
        customer: {
          id: '2',
          name: 'Local Game Store',
          email: 'owner@localgamestore.com',
          address: {
            street: '123 Main St',
            city: 'Portland',
            state: 'OR',
            zip: '97201',
            country: 'US'
          }
        },
        items: [
          { id: '1', description: 'Mayhem Merchant Starter Pack', quantity: 10, rate: 45.00, amount: 450.00, tax: 0 }
        ],
        dates: {
          issued: new Date('2024-10-15'),
          due: new Date('2024-11-15')
        },
        amounts: {
          subtotal: 450.00,
          tax: 0,
          discount: 0,
          total: 450.00,
          paid: 0,
          balance: 450.00
        },
        payment: {},
        notes: 'Second reminder sent'
      },
      {
        id: '3',
        number: 'INV-2024-003',
        status: 'sent',
        type: 'invoice',
        customer: {
          id: '3',
          name: 'Barnes & Noble',
          email: 'purchasing@bn.com',
          company: 'Barnes & Noble Inc',
          address: {
            street: '122 Fifth Avenue',
            city: 'New York',
            state: 'NY',
            zip: '10011',
            country: 'US'
          },
          taxId: 'XX-XXXXXXX'
        },
        items: [
          { id: '1', description: 'Full Uproar Games Catalog - Q1 2025', quantity: 200, rate: 32.50, amount: 6500.00, tax: 569.38 }
        ],
        dates: {
          issued: new Date('2024-12-01'),
          due: new Date('2025-01-15')
        },
        amounts: {
          subtotal: 6500.00,
          tax: 569.38,
          discount: 325.00,
          total: 6744.38,
          paid: 0,
          balance: 6744.38
        },
        payment: {},
        terms: 'Net 45, 2/10',
        recurring: {
          frequency: 'quarterly',
          nextDate: new Date('2025-03-01')
        }
      }
    ];
    setInvoices(mockInvoices);
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: '#64748b',
      sent: '#3b82f6',
      viewed: '#8b5cf6',
      paid: '#10b981',
      overdue: '#ef4444',
      cancelled: '#6b7280',
      refunded: '#f59e0b'
    };
    return colors[status] || '#94a3b8';
  };

  const calculateTotals = () => {
    const totals = invoices.reduce((acc, inv) => ({
      outstanding: acc.outstanding + (inv.status === 'sent' || inv.status === 'viewed' ? inv.amounts.balance : 0),
      overdue: acc.overdue + (inv.status === 'overdue' ? inv.amounts.balance : 0),
      paid: acc.paid + (inv.status === 'paid' ? inv.amounts.total : 0),
      draft: acc.draft + (inv.status === 'draft' ? inv.amounts.total : 0)
    }), { outstanding: 0, overdue: 0, paid: 0, draft: 0 });
    return totals;
  };

  const renderInvoiceList = () => {
    const totals = calculateTotals();
    
    return (
      <div>
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <Receipt size={24} style={{ color: '#3b82f6' }} />
              <span style={{ color: '#3b82f6', fontSize: '12px' }}>Outstanding</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', margin: '10px 0' }}>
              ${totals.outstanding.toLocaleString()}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Awaiting Payment</p>
          </div>

          <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: '12px' }}>Action Required</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444', margin: '10px 0' }}>
              ${totals.overdue.toLocaleString()}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Overdue</p>
          </div>

          <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <CheckCircle size={24} style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981', fontSize: '12px' }}>This Month</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}>
              ${totals.paid.toLocaleString()}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Paid</p>
          </div>

          <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <FileText size={24} style={{ color: '#64748b' }} />
              <span style={{ color: '#64748b', fontSize: '12px' }}>Pending</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#64748b', margin: '10px 0' }}>
              ${totals.draft.toLocaleString()}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>In Drafts</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...adminStyles.input, paddingLeft: '40px' }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={adminStyles.select}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <button 
            onClick={() => setShowInvoiceModal(true)}
            style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            <Plus size={16} style={{ marginRight: '8px' }} />
            New Invoice
          </button>
        </div>

        {/* Invoice Table */}
        <div style={adminStyles.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(249, 115, 22, 0.3)' }}>
                  <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Number</th>
                  <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Customer</th>
                  <th style={adminStyles.tableHeader}>Amount</th>
                  <th style={adminStyles.tableHeader}>Due Date</th>
                  <th style={adminStyles.tableHeader}>Status</th>
                  <th style={adminStyles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices
                  .filter(inv => filterStatus === 'all' || inv.status === filterStatus)
                  .filter(inv => 
                    searchTerm === '' || 
                    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(invoice => (
                    <tr key={invoice.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          style={{ 
                            color: '#fde68a',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          {invoice.number}
                        </button>
                      </td>
                      <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>
                        <div>
                          <div style={{ color: '#e2e8f0' }}>{invoice.customer.name}</div>
                          {invoice.customer.company && (
                            <div style={{ color: '#64748b', fontSize: '12px' }}>{invoice.customer.company}</div>
                          )}
                        </div>
                      </td>
                      <td style={{ ...adminStyles.tableCell, fontWeight: 'bold', color: '#fde68a' }}>
                        ${invoice.amounts.total.toLocaleString()}
                      </td>
                      <td style={adminStyles.tableCell}>
                        <div>
                          <div style={{ color: invoice.status === 'overdue' ? '#ef4444' : '#e2e8f0' }}>
                            {invoice.dates.due.toLocaleDateString()}
                          </div>
                          {invoice.status === 'overdue' && (
                            <div style={{ color: '#ef4444', fontSize: '12px' }}>
                              {Math.floor((Date.now() - invoice.dates.due.getTime()) / (1000 * 60 * 60 * 24))} days overdue
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={adminStyles.tableCell}>
                        <span style={{ 
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: `${getStatusColor(invoice.status)}22`,
                          color: getStatusColor(invoice.status),
                          fontSize: '12px',
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}>
                          {invoice.status}
                        </span>
                      </td>
                      <td style={adminStyles.tableCell}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => setSelectedInvoice(invoice)}
                            style={{ ...adminStyles.iconButton, color: '#3b82f6' }}
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          {(invoice.status === 'draft' || invoice.status === 'sent') && (
                            <button 
                              style={{ ...adminStyles.iconButton, color: '#10b981' }}
                              title="Send"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          {invoice.status === 'sent' && (
                            <button 
                              onClick={() => setShowPaymentModal(true)}
                              style={{ ...adminStyles.iconButton, color: '#fbbf24' }}
                              title="Record Payment"
                            >
                              <DollarSign size={16} />
                            </button>
                          )}
                          <button 
                            style={{ ...adminStyles.iconButton, color: '#8b5cf6' }}
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Detail Modal */}
        {selectedInvoice && (
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
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '2px solid rgba(249, 115, 22, 0.3)'
            }}>
              {/* Invoice Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div>
                  <h2 style={{ color: '#fde68a', fontSize: '28px', marginBottom: '10px' }}>
                    INVOICE
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '16px' }}>{selectedInvoice.number}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <Image src="/logo.png" alt="Full Uproar" width={150} height={50} style={{ height: '50px', width: 'auto' }} />
                  </div>
                  <div style={{ color: '#e2e8f0', fontSize: '14px' }}>
                    <div>Full Uproar Games</div>
                    <div>123 Chaos Street</div>
                    <div>Mayhem City, CA 90210</div>
                    <div>games@fulluproar.com</div>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                <div>
                  <h3 style={{ color: '#fdba74', fontSize: '14px', marginBottom: '10px' }}>BILL TO</h3>
                  <div style={{ color: '#e2e8f0' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{selectedInvoice.customer.name}</div>
                    {selectedInvoice.customer.company && <div>{selectedInvoice.customer.company}</div>}
                    <div>{selectedInvoice.customer.address.street}</div>
                    <div>{selectedInvoice.customer.address.city}, {selectedInvoice.customer.address.state} {selectedInvoice.customer.address.zip}</div>
                    <div>{selectedInvoice.customer.email}</div>
                    {selectedInvoice.customer.taxId && <div>Tax ID: {selectedInvoice.customer.taxId}</div>}
                  </div>
                </div>
                <div>
                  <h3 style={{ color: '#fdba74', fontSize: '14px', marginBottom: '10px' }}>INVOICE DETAILS</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Issue Date:</span>
                      <span style={{ color: '#e2e8f0' }}>{selectedInvoice.dates.issued.toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Due Date:</span>
                      <span style={{ color: selectedInvoice.status === 'overdue' ? '#ef4444' : '#e2e8f0' }}>
                        {selectedInvoice.dates.due.toLocaleDateString()}
                      </span>
                    </div>
                    {selectedInvoice.terms && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Terms:</span>
                        <span style={{ color: '#e2e8f0' }}>{selectedInvoice.terms}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Status:</span>
                      <span style={{ color: getStatusColor(selectedInvoice.status), textTransform: 'capitalize' }}>
                        {selectedInvoice.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: '30px' }}>
                <table style={{ width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(249, 115, 22, 0.3)' }}>
                      <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Description</th>
                      <th style={{ ...adminStyles.tableHeader, textAlign: 'center' }}>Qty</th>
                      <th style={{ ...adminStyles.tableHeader, textAlign: 'right' }}>Rate</th>
                      <th style={{ ...adminStyles.tableHeader, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <td style={{ padding: '12px 0', color: '#e2e8f0' }}>{item.description}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', color: '#e2e8f0' }}>{item.quantity}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: '#e2e8f0' }}>${item.rate.toFixed(2)}</td>
                        <td style={{ padding: '12px 0', textAlign: 'right', color: '#e2e8f0' }}>${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
                <div style={{ width: '250px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#94a3b8' }}>Subtotal</span>
                    <span style={{ color: '#e2e8f0' }}>${selectedInvoice.amounts.subtotal.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.amounts.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Discount</span>
                      <span style={{ color: '#10b981' }}>-${selectedInvoice.amounts.discount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedInvoice.amounts.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#94a3b8' }}>Tax</span>
                      <span style={{ color: '#e2e8f0' }}>${selectedInvoice.amounts.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '2px solid rgba(249, 115, 22, 0.3)',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}>
                    <span style={{ color: '#fdba74' }}>Total</span>
                    <span style={{ color: '#fdba74' }}>${selectedInvoice.amounts.total.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.amounts.paid > 0 && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                        <span style={{ color: '#94a3b8' }}>Paid</span>
                        <span style={{ color: '#10b981' }}>${selectedInvoice.amounts.paid.toFixed(2)}</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginTop: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        <span style={{ color: '#fde68a' }}>Balance Due</span>
                        <span style={{ color: '#fde68a' }}>${selectedInvoice.amounts.balance.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px' }}>
                  <h4 style={{ color: '#fdba74', fontSize: '14px', marginBottom: '8px' }}>Notes</h4>
                  <p style={{ color: '#e2e8f0', fontSize: '14px' }}>{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                    <Printer size={16} style={{ marginRight: '8px' }} />
                    Print
                  </button>
                  <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                    <Download size={16} style={{ marginRight: '8px' }} />
                    Download PDF
                  </button>
                  {selectedInvoice.status === 'draft' && (
                    <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                      <Send size={16} style={{ marginRight: '8px' }} />
                      Send Invoice
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  style={{ ...adminStyles.button, background: 'rgba(148, 163, 184, 0.1)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPaymentTracking = () => (
    <div>
      <h2 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>
        <CreditCard size={24} style={{ marginRight: '10px', color: '#10b981' }} />
        Payment Tracking
      </h2>

      {/* Payment Methods Setup */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={adminStyles.card}>
          <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Accepted Payment Methods</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { method: 'Credit Card', enabled: true, processor: 'Stripe', icon: <CreditCard /> },
              { method: 'ACH Transfer', enabled: true, processor: 'Plaid', icon: <Building /> },
              { method: 'Wire Transfer', enabled: true, processor: 'Manual', icon: <Banknote /> },
              { method: 'Check', enabled: false, processor: 'Manual', icon: <FileText /> }
            ].map(payment => (
              <div key={payment.method} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px',
                background: 'rgba(148, 163, 184, 0.05)',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ color: payment.enabled ? '#10b981' : '#64748b' }}>
                    {payment.icon}
                  </div>
                  <div>
                    <div style={{ color: '#fde68a' }}>{payment.method}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{payment.processor}</div>
                  </div>
                </div>
                <button style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  background: payment.enabled ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                  color: payment.enabled ? '#10b981' : '#64748b',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}>
                  {payment.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={adminStyles.card}>
          <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Recent Payments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { invoice: 'INV-2024-001', amount: 2736.15, method: 'Wire', date: new Date('2024-11-28') },
              { invoice: 'INV-2024-098', amount: 450.00, method: 'Card', date: new Date('2024-11-27') },
              { invoice: 'INV-2024-097', amount: 1250.00, method: 'ACH', date: new Date('2024-11-26') }
            ].map((payment, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#fde68a', fontSize: '14px' }}>{payment.invoice}</div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    {payment.date.toLocaleDateString()} • {payment.method}
                  </div>
                </div>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                  +${payment.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Links */}
      <div style={adminStyles.card}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Active Payment Links</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(249, 115, 22, 0.3)' }}>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Invoice</th>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Customer</th>
                <th style={adminStyles.tableHeader}>Amount</th>
                <th style={adminStyles.tableHeader}>Created</th>
                <th style={adminStyles.tableHeader}>Expires</th>
                <th style={adminStyles.tableHeader}>Status</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>INV-2024-002</td>
                <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>Local Game Store</td>
                <td style={adminStyles.tableCell}>$450.00</td>
                <td style={adminStyles.tableCell}>Nov 15</td>
                <td style={adminStyles.tableCell}>Dec 15</td>
                <td style={adminStyles.tableCell}>
                  <span style={{ color: '#f59e0b' }}>Viewed</span>
                </td>
                <td style={adminStyles.tableCell}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button style={{ ...adminStyles.iconButton, color: '#3b82f6' }}>
                      <Link size={16} />
                    </button>
                    <button style={{ ...adminStyles.iconButton, color: '#10b981' }}>
                      <Mail size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={adminStyles.title}>
          Invoicing & Payments
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Create, send, and track invoices with integrated payment processing
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {[
          { id: 'invoices', label: 'Invoices', icon: <FileText size={16} /> },
          { id: 'payments', label: 'Payments', icon: <CreditCard size={16} /> },
          { id: 'customers', label: 'Customers', icon: <Users size={16} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
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
              gap: '8px'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'invoices' && renderInvoiceList()}
      {activeTab === 'payments' && renderPaymentTracking()}
      {activeTab === 'customers' && (
        <div style={adminStyles.card}>
          <h3 style={adminStyles.sectionTitle}>Customer Management</h3>
          <p style={{ color: '#94a3b8' }}>Customer database with payment history and credit terms coming soon...</p>
        </div>
      )}
      {activeTab === 'settings' && (
        <div style={adminStyles.card}>
          <h3 style={adminStyles.sectionTitle}>Invoice Settings</h3>
          <p style={{ color: '#94a3b8' }}>Configure invoice templates, numbering, and payment terms...</p>
        </div>
      )}
    </div>
  );
}

// Add missing imports
import { Settings, Users } from 'lucide-react';