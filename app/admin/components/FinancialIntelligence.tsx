'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, 
  CreditCard, Receipt, PieChart, BarChart3, Activity,
  Calculator, FileText, Download, Upload, Calendar,
  ArrowUpRight, ArrowDownRight, Minus, Globe,
  Building, Briefcase, Package, ShoppingCart,
  AlertCircle, CheckCircle, Clock, Filter,
  ChevronRight, ChevronDown, RefreshCw, Zap,
  Banknote, Coins, Landmark, PiggyBank, Wallet
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface FinancialMetrics {
  revenue: {
    today: number;
    week: number;
    month: number;
    quarter: number;
    year: number;
    growth: {
      day: number;
      week: number;
      month: number;
      year: number;
    };
  };
  expenses: {
    cogs: number;
    marketing: number;
    operations: number;
    payroll: number;
    other: number;
    total: number;
  };
  profit: {
    gross: number;
    operating: number;
    net: number;
    margin: number;
    ebitda: number;
  };
  cashflow: {
    incoming: number;
    outgoing: number;
    net: number;
    runway: number; // months
    burnRate: number;
  };
  tax: {
    collected: number;
    owed: number;
    byState: Record<string, number>;
    nextPayment: Date;
  };
  accounts: {
    receivable: number;
    payable: number;
    overdue: number;
  };
}

interface Transaction {
  id: string;
  date: Date;
  type: 'sale' | 'refund' | 'expense' | 'payout' | 'fee' | 'tax';
  category: string;
  description: string;
  amount: number;
  balance: number;
  source: 'stripe' | 'paypal' | 'bank' | 'cash' | 'other';
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
}

interface TaxRate {
  state: string;
  rate: number;
  nexus: boolean;
  lastUpdated: Date;
  thresholds: {
    transactions: number;
    revenue: number;
  };
}

export default function FinancialIntelligence({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'cashflow' | 'pl' | 'tax' | 'forecast' | 'transactions'>('overview');
  const [dateRange, setDateRange] = useState('month');
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Mock financial data
  useEffect(() => {
    setMetrics({
      revenue: {
        today: 3847.23,
        week: 28394.12,
        month: 124892.45,
        quarter: 384729.33,
        year: 1243892.12,
        growth: {
          day: 12.4,
          week: 8.2,
          month: 15.7,
          year: 45.3
        }
      },
      expenses: {
        cogs: 42384.23,
        marketing: 12493.45,
        operations: 8234.12,
        payroll: 198500.00,
        other: 4382.11,
        total: 265993.91
      },
      profit: {
        gross: 82508.22,
        operating: 65234.11,
        net: 52187.09,
        margin: 41.8,
        ebitda: 71234.55
      },
      cashflow: {
        incoming: 134892.45,
        outgoing: 98234.12,
        net: 36658.33,
        runway: 8.4,
        burnRate: 32411.23
      },
      tax: {
        collected: 18234.12,
        owed: 12493.33,
        byState: {
          'CA': 8234.12,
          'NY': 3492.11,
          'TX': 2834.00,
          'FL': 1983.22,
          'other': 1690.67
        },
        nextPayment: new Date('2024-12-31')
      },
      accounts: {
        receivable: 23492.11,
        payable: 18234.90,
        overdue: 3492.00
      }
    });

    setTransactions([
      {
        id: '1',
        date: new Date(),
        type: 'sale',
        category: 'Games',
        description: 'Chaos & Mayhem Deluxe - Order #12345',
        amount: 89.99,
        balance: 134892.45,
        source: 'stripe',
        status: 'completed'
      },
      {
        id: '2',
        date: new Date(Date.now() - 3600000),
        type: 'expense',
        category: 'Marketing',
        description: 'Facebook Ads Campaign',
        amount: -234.50,
        balance: 134802.46,
        source: 'bank',
        status: 'completed'
      },
      {
        id: '3',
        date: new Date(Date.now() - 7200000),
        type: 'payout',
        category: 'Transfer',
        description: 'Stripe Payout to Bank',
        amount: 8234.12,
        balance: 135036.96,
        source: 'stripe',
        status: 'pending'
      }
    ]);
  }, []);

  const getChangeIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight size={16} style={{ color: '#10b981' }} />;
    if (value < 0) return <ArrowDownRight size={16} style={{ color: '#ef4444' }} />;
    return <Minus size={16} style={{ color: '#64748b' }} />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderOverview = () => (
    <div>
      {/* Real-time Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <TrendingUp size={24} style={{ color: '#10b981' }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '14px' }}>
              {getChangeIcon(metrics?.revenue.growth.month || 0)}
              {metrics?.revenue.growth.month}%
            </span>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', margin: '10px 0' }}>
            {formatCurrency(metrics?.revenue.month || 0)}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Monthly Revenue</p>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>Today</span>
              <span style={{ color: '#10b981' }}>{formatCurrency(metrics?.revenue.today || 0)}</span>
            </div>
          </div>
        </div>

        <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Receipt size={24} style={{ color: '#ef4444' }} />
            <span style={{ color: '#f59e0b', fontSize: '14px' }}>↑ 5.2%</span>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444', margin: '10px 0' }}>
            {formatCurrency(metrics?.expenses.total || 0)}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Monthly Expenses</p>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>Payroll</span>
              <span style={{ color: '#ef4444' }}>{formatCurrency(metrics?.expenses.payroll || 0)}</span>
            </div>
          </div>
        </div>

        <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Wallet size={24} style={{ color: '#fbbf24' }} />
            <span style={{ color: '#10b981', fontSize: '14px' }}>Healthy</span>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24', margin: '10px 0' }}>
            {formatCurrency(metrics?.profit.net || 0)}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Net Profit</p>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>Margin</span>
              <span style={{ color: '#fbbf24' }}>{metrics?.profit.margin}%</span>
            </div>
          </div>
        </div>

        <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <PiggyBank size={24} style={{ color: '#8b5cf6' }} />
            <span style={{ color: '#10b981', fontSize: '14px' }}>{metrics?.cashflow.runway} mo</span>
          </div>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', margin: '10px 0' }}>
            {formatCurrency(metrics?.cashflow.net || 0)}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Cash Balance</p>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#64748b' }}>Burn Rate</span>
              <span style={{ color: '#8b5cf6' }}>{formatCurrency(metrics?.cashflow.burnRate || 0)}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={adminStyles.card}>
          <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>
            Revenue Streams
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { name: 'Board Games', amount: 68234.12, percentage: 55, color: '#f97316' },
              { name: 'Merchandise', amount: 32492.11, percentage: 26, color: '#8b5cf6' },
              { name: 'Digital Products', amount: 12384.90, percentage: 10, color: '#3b82f6' },
              { name: 'Fugly Prime', amount: 8923.44, percentage: 7, color: '#10b981' },
              { name: 'Wholesale', amount: 2857.88, percentage: 2, color: '#ec4899' }
            ].map(stream => (
              <div key={stream.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#fde68a' }}>{stream.name}</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{formatCurrency(stream.amount)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    flex: 1,
                    height: '8px', 
                    background: 'rgba(148, 163, 184, 0.1)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${stream.percentage}%`, 
                      height: '100%', 
                      background: stream.color,
                      transition: 'width 0.5s'
                    }} />
                  </div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{stream.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={adminStyles.card}>
          <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <Download size={16} style={{ marginRight: '8px' }} />
              Export P&L Statement
            </button>
            <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <Calculator size={16} style={{ marginRight: '8px' }} />
              Calculate Taxes
            </button>
            <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              <CreditCard size={16} style={{ marginRight: '8px' }} />
              Process Payouts
            </button>
            <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              <FileText size={16} style={{ marginRight: '8px' }} />
              Generate Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Expense Categories */}
      <div style={adminStyles.card}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>
          Expense Breakdown
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { category: 'COGS', amount: metrics?.expenses.cogs || 0, icon: <Package />, color: '#ef4444' },
            { category: 'Payroll', amount: metrics?.expenses.payroll || 0, icon: <Users />, color: '#f59e0b' },
            { category: 'Marketing', amount: metrics?.expenses.marketing || 0, icon: <TrendingUp />, color: '#8b5cf6' },
            { category: 'Operations', amount: metrics?.expenses.operations || 0, icon: <Building />, color: '#3b82f6' },
            { category: 'Other', amount: metrics?.expenses.other || 0, icon: <Briefcase />, color: '#64748b' }
          ].map(expense => (
            <div key={expense.category} style={{ 
              padding: '15px',
              background: 'rgba(148, 163, 184, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ color: expense.color }}>{expense.icon}</div>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>{expense.category}</span>
              </div>
              <div style={{ color: expense.color, fontSize: '24px', fontWeight: 'bold' }}>
                {formatCurrency(expense.amount)}
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>
                {((expense.amount / (metrics?.expenses.total || 1)) * 100).toFixed(1)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCashflow = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...adminStyles.sectionTitle, margin: 0 }}>
          <Activity size={24} style={{ marginRight: '10px', color: '#06b6d4' }} />
          Cash Flow Analysis
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={adminStyles.button}>
            <RefreshCw size={16} style={{ marginRight: '8px' }} />
            Sync Bank
          </button>
          <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Download size={16} style={{ marginRight: '8px' }} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Cash Flow Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={adminStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <ArrowUpRight size={20} style={{ color: '#10b981' }} />
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Incoming</span>
          </div>
          <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
            {formatCurrency(metrics?.cashflow.incoming || 0)}
          </div>
        </div>

        <div style={adminStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <ArrowDownRight size={20} style={{ color: '#ef4444' }} />
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Outgoing</span>
          </div>
          <div style={{ color: '#ef4444', fontSize: '28px', fontWeight: 'bold' }}>
            {formatCurrency(metrics?.cashflow.outgoing || 0)}
          </div>
        </div>

        <div style={adminStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Wallet size={20} style={{ color: '#fbbf24' }} />
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Net Flow</span>
          </div>
          <div style={{ color: '#fbbf24', fontSize: '28px', fontWeight: 'bold' }}>
            {formatCurrency(metrics?.cashflow.net || 0)}
          </div>
        </div>

        <div style={adminStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Clock size={20} style={{ color: '#8b5cf6' }} />
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Runway</span>
          </div>
          <div style={{ color: '#8b5cf6', fontSize: '28px', fontWeight: 'bold' }}>
            {metrics?.cashflow.runway} months
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div style={adminStyles.card}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Recent Transactions</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(249, 115, 22, 0.3)' }}>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Date</th>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Description</th>
                <th style={adminStyles.tableHeader}>Category</th>
                <th style={adminStyles.tableHeader}>Source</th>
                <th style={adminStyles.tableHeader}>Amount</th>
                <th style={adminStyles.tableHeader}>Balance</th>
                <th style={adminStyles.tableHeader}>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>
                    {tx.date.toLocaleDateString()}
                  </td>
                  <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>
                    <div style={{ color: '#fde68a' }}>{tx.description}</div>
                    {tx.reference && <div style={{ color: '#64748b', fontSize: '12px' }}>{tx.reference}</div>}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: 'rgba(148, 163, 184, 0.1)',
                      color: '#94a3b8',
                      fontSize: '12px'
                    }}>
                      {tx.category}
                    </span>
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{ textTransform: 'uppercase', fontSize: '12px', color: '#94a3b8' }}>
                      {tx.source}
                    </span>
                  </td>
                  <td style={{ 
                    ...adminStyles.tableCell,
                    color: tx.amount > 0 ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                  </td>
                  <td style={{ ...adminStyles.tableCell, color: '#fde68a' }}>
                    {formatCurrency(tx.balance)}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      justifyContent: 'center',
                      color: tx.status === 'completed' ? '#10b981' : 
                             tx.status === 'pending' ? '#f59e0b' : '#ef4444'
                    }}>
                      {tx.status === 'completed' && <CheckCircle size={14} />}
                      {tx.status === 'pending' && <Clock size={14} />}
                      {tx.status === 'failed' && <AlertCircle size={14} />}
                      <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>{tx.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPL = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...adminStyles.sectionTitle, margin: 0 }}>
          <FileText size={24} style={{ marginRight: '10px', color: '#8b5cf6' }} />
          Profit & Loss Statement
        </h2>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={adminStyles.select}>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* P&L Statement */}
      <div style={adminStyles.card}>
        <h3 style={{ color: '#fde68a', fontSize: '20px', marginBottom: '20px', textAlign: 'center' }}>
          Full Uproar Games - Income Statement
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginBottom: '30px' }}>
          For the period ending {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Revenue Section */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#10b981', fontSize: '16px', marginBottom: '15px', borderBottom: '2px solid rgba(16, 185, 129, 0.3)', paddingBottom: '8px' }}>
              REVENUE
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Product Sales</span>
                <span style={{ color: '#e2e8f0' }}>{formatCurrency(101234.56)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Subscription Revenue</span>
                <span style={{ color: '#e2e8f0' }}>{formatCurrency(8923.44)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Wholesale</span>
                <span style={{ color: '#e2e8f0' }}>{formatCurrency(14734.45)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <span style={{ color: '#10b981' }}>Total Revenue</span>
                <span style={{ color: '#10b981' }}>{formatCurrency(124892.45)}</span>
              </div>
            </div>
          </div>

          {/* COGS Section */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#ef4444', fontSize: '16px', marginBottom: '15px', borderBottom: '2px solid rgba(239, 68, 68, 0.3)', paddingBottom: '8px' }}>
              COST OF GOODS SOLD
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Manufacturing</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(28492.11)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Shipping & Fulfillment</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(8234.90)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Packaging</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(5657.22)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <span style={{ color: '#ef4444' }}>Total COGS</span>
                <span style={{ color: '#ef4444' }}>({formatCurrency(42384.23)})</span>
              </div>
            </div>
          </div>

          {/* Gross Profit */}
          <div style={{ marginBottom: '30px', padding: '15px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
              <span style={{ color: '#fbbf24' }}>GROSS PROFIT</span>
              <span style={{ color: '#fbbf24' }}>{formatCurrency(82508.22)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginTop: '5px' }}>
              <span style={{ color: '#94a3b8' }}>Gross Margin</span>
              <span style={{ color: '#94a3b8' }}>66.1%</span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#f59e0b', fontSize: '16px', marginBottom: '15px', borderBottom: '2px solid rgba(245, 158, 11, 0.3)', paddingBottom: '8px' }}>
              OPERATING EXPENSES
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Marketing & Advertising</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(12493.45)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Salaries & Benefits</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(0)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Software & Tools</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(2384.66)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Professional Services</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(1896.00)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <span style={{ color: '#f59e0b' }}>Total Operating Expenses</span>
                <span style={{ color: '#f59e0b' }}>({formatCurrency(17274.11)})</span>
              </div>
            </div>
          </div>

          {/* Operating Income */}
          <div style={{ marginBottom: '30px', padding: '15px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
              <span style={{ color: '#8b5cf6' }}>OPERATING INCOME (EBITDA)</span>
              <span style={{ color: '#8b5cf6' }}>{formatCurrency(65234.11)}</span>
            </div>
          </div>

          {/* Other Income/Expenses */}
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ color: '#64748b', fontSize: '16px', marginBottom: '15px', borderBottom: '2px solid rgba(100, 116, 139, 0.3)', paddingBottom: '8px' }}>
              OTHER INCOME & EXPENSES
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Interest Income</span>
                <span style={{ color: '#e2e8f0' }}>{formatCurrency(234.00)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Transaction Fees</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(3847.02)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e2e8f0', paddingLeft: '20px' }}>Tax Provision</span>
                <span style={{ color: '#e2e8f0' }}>({formatCurrency(9434.00)})</span>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div style={{ 
            padding: '20px', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
            borderRadius: '8px',
            border: '2px solid rgba(16, 185, 129, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: 'bold' }}>
              <span style={{ color: '#10b981' }}>NET INCOME</span>
              <span style={{ color: '#10b981' }}>{formatCurrency(52187.09)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginTop: '10px' }}>
              <span style={{ color: '#94a3b8' }}>Net Margin</span>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>41.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTax = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...adminStyles.sectionTitle, margin: 0 }}>
          <Landmark size={24} style={{ marginRight: '10px', color: '#ef4444' }} />
          Tax Management
        </h2>
        <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
          <Calculator size={16} style={{ marginRight: '8px' }} />
          Calculate Q4 Taxes
        </button>
      </div>

      {/* Tax Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={adminStyles.card}>
          <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Tax Collected</h4>
          <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
            {formatCurrency(metrics?.tax.collected || 0)}
          </div>
        </div>
        <div style={adminStyles.card}>
          <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Tax Owed</h4>
          <div style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>
            {formatCurrency(metrics?.tax.owed || 0)}
          </div>
        </div>
        <div style={adminStyles.card}>
          <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Next Payment</h4>
          <div style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 'bold' }}>
            {metrics?.tax.nextPayment.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div style={adminStyles.card}>
          <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Nexus States</h4>
          <div style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 'bold' }}>
            {Object.keys(metrics?.tax.byState || {}).length}
          </div>
        </div>
      </div>

      {/* State Tax Breakdown */}
      <div style={adminStyles.card}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Sales Tax by State</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(249, 115, 22, 0.3)' }}>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>State</th>
                <th style={adminStyles.tableHeader}>Tax Rate</th>
                <th style={adminStyles.tableHeader}>Transactions</th>
                <th style={adminStyles.tableHeader}>Gross Sales</th>
                <th style={adminStyles.tableHeader}>Tax Collected</th>
                <th style={adminStyles.tableHeader}>Tax Owed</th>
                <th style={adminStyles.tableHeader}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics?.tax.byState || {}).map(([state, amount]) => (
                <tr key={state} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Globe size={16} style={{ color: '#64748b' }} />
                      <span style={{ color: '#fde68a' }}>{state === 'other' ? 'Other States' : state}</span>
                    </div>
                  </td>
                  <td style={adminStyles.tableCell}>7.25%</td>
                  <td style={adminStyles.tableCell}>234</td>
                  <td style={adminStyles.tableCell}>{formatCurrency(amount * 13.8)}</td>
                  <td style={{ ...adminStyles.tableCell, color: '#10b981' }}>
                    {formatCurrency(amount)}
                  </td>
                  <td style={{ ...adminStyles.tableCell, color: '#ef4444' }}>
                    {formatCurrency(amount * 0.85)}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <span style={{ 
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      fontSize: '12px'
                    }}>
                      Compliant
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Tax Compliance Alert</span>
          </div>
          <p style={{ color: '#e2e8f0', fontSize: '14px' }}>
            You are approaching the economic nexus threshold in Texas (182/200 transactions). 
            Consider registering for a sales tax permit soon.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={adminStyles.title}>
          Financial Intelligence
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Real-time financial metrics and automated accounting
        </p>
      </div>

      {/* Quick Stats Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '30px',
        padding: '20px',
        background: 'rgba(30, 41, 59, 0.8)',
        borderRadius: '12px',
        border: '2px solid rgba(249, 115, 22, 0.3)',
        overflowX: 'auto'
      }}>
        <div style={{ minWidth: '150px' }}>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Today's Revenue</div>
          <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
            {formatCurrency(metrics?.revenue.today || 0)}
          </div>
        </div>
        <div style={{ minWidth: '150px' }}>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Pending Payouts</div>
          <div style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold' }}>
            {formatCurrency(8234.12)}
          </div>
        </div>
        <div style={{ minWidth: '150px' }}>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Outstanding AR</div>
          <div style={{ color: '#8b5cf6', fontSize: '20px', fontWeight: 'bold' }}>
            {formatCurrency(metrics?.accounts.receivable || 0)}
          </div>
        </div>
        <div style={{ minWidth: '150px' }}>
          <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>Overdue Invoices</div>
          <div style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>
            {formatCurrency(metrics?.accounts.overdue || 0)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <PieChart size={16} /> },
          { id: 'cashflow', label: 'Cash Flow', icon: <Activity size={16} /> },
          { id: 'pl', label: 'P&L Statement', icon: <FileText size={16} /> },
          { id: 'tax', label: 'Tax Center', icon: <Landmark size={16} /> },
          { id: 'forecast', label: 'Forecast', icon: <TrendingUp size={16} /> },
          { id: 'transactions', label: 'Transactions', icon: <CreditCard size={16} /> }
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
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'cashflow' && renderCashflow()}
      {activeTab === 'pl' && renderPL()}
      {activeTab === 'tax' && renderTax()}
      {activeTab === 'forecast' && (
        <div style={adminStyles.card}>
          <h3 style={adminStyles.sectionTitle}>Financial Forecasting</h3>
          <p style={{ color: '#94a3b8' }}>AI-powered revenue predictions and scenario planning coming soon...</p>
        </div>
      )}
      {activeTab === 'transactions' && (
        <div style={adminStyles.card}>
          <h3 style={adminStyles.sectionTitle}>Transaction Management</h3>
          <p style={{ color: '#94a3b8' }}>Complete transaction history with reconciliation tools coming soon...</p>
        </div>
      )}
    </div>
  );
}

// Add missing import
import { Users } from 'lucide-react';