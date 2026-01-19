'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare, Clock, CheckCircle,
  AlertCircle, Search, User,
  Package, CreditCard, Send, X, Plus, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { adminStyles } from '../styles/adminStyles';
import { useToastStore } from '@/lib/toastStore';

const POLL_INTERVAL = 60000; // 60 seconds

interface Ticket {
  id: number;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  orderId?: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: number;
    senderType: string;
    message: string;
    createdAt: string;
  }>;
  order?: {
    id: string;
    totalCents: number;
    status: string;
  };
}

const statusConfig = {
  new: { icon: AlertCircle, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', label: 'New' },
  in_progress: { icon: Clock, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'In Progress' },
  waiting_on_customer: { icon: User, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.1)', label: 'Waiting on Customer' },
  resolved: { icon: CheckCircle, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Resolved' },
  closed: { icon: X, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: 'Closed' }
};

const priorityConfig = {
  low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  normal: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  urgent: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
};

const categoryConfig = {
  order_issue: { label: 'Order Issue', icon: Package },
  payment_issue: { label: 'Payment Issue', icon: CreditCard },
  shipping: { label: 'Shipping', icon: Package },
  product_question: { label: 'Product Question', icon: MessageSquare },
  return_refund: { label: 'Return/Refund', icon: Package },
  technical: { label: 'Technical Issue', icon: AlertCircle },
  other: { label: 'Other', icon: MessageSquare }
};

export default function SupportPage() {
  const addToast = useToastStore((state) => state.addToast);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' = all non-closed
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'ticketNumber' | 'status' | 'priority' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [stats, setStats] = useState({
    totalNew: 0,
    totalInProgress: 0,
    totalResolved: 0,
    avgResponseTime: 0
  });
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousTicketsRef = useRef<Ticket[]>([]);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await pollTickets();
    setIsRefreshing(false);
    addToast({ message: 'Tickets refreshed', type: 'success' });
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Silent fetch for polling (doesn't reset loading state)
  const pollTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter })
      });

      const response = await fetch(`/api/admin/support/tickets?${params}`);
      const data = await response.json();

      const newTickets: Ticket[] = data.tickets || [];

      // Check for new tickets or messages
      const previousIds = new Set(previousTicketsRef.current.map(t => t.id));
      const newTicketCount = newTickets.filter(t => !previousIds.has(t.id)).length;

      // Check for new messages on existing tickets
      let newMessageCount = 0;
      newTickets.forEach(newTicket => {
        const oldTicket = previousTicketsRef.current.find(t => t.id === newTicket.id);
        if (oldTicket && newTicket.messages.length > oldTicket.messages.length) {
          newMessageCount += newTicket.messages.length - oldTicket.messages.length;
        }
      });

      // Show toast for new activity
      if (newTicketCount > 0) {
        addToast({
          message: `🎫 ${newTicketCount} new ticket${newTicketCount > 1 ? 's' : ''} received!`,
          type: 'info'
        });
      } else if (newMessageCount > 0) {
        addToast({
          message: `💬 ${newMessageCount} new message${newMessageCount > 1 ? 's' : ''} received!`,
          type: 'info'
        });
      }

      // Update selected ticket if it has new messages
      if (selectedTicket) {
        const updatedSelectedTicket = newTickets.find(t => t.id === selectedTicket.id);
        if (updatedSelectedTicket && updatedSelectedTicket.messages.length > selectedTicket.messages.length) {
          setSelectedTicket(updatedSelectedTicket);
          setTimeout(scrollToBottom, 100);
        }
      }

      previousTicketsRef.current = newTickets;
      setTickets(newTickets);
      setStats(data.stats || stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error polling tickets:', error);
    }
  }, [statusFilter, priorityFilter, categoryFilter, selectedTicket, addToast, stats]);

  // Initial fetch
  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  // Polling interval
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(pollTickets, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isLive, pollTickets]);

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter })
      });

      const response = await fetch(`/api/admin/support/tickets?${params}`);
      const data = await response.json();

      const fetchedTickets = data.tickets || [];
      previousTicketsRef.current = fetchedTickets;
      setTickets(fetchedTickets);
      setStats(data.stats || {
        totalNew: 0,
        totalInProgress: 0,
        totalResolved: 0,
        avgResponseTime: 0
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setTickets(tickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        ));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const selectTicket = async (ticket: Ticket) => {
    // Set the ticket immediately for responsiveness
    setSelectedTicket(ticket);

    // Fetch fresh messages in the background
    try {
      const response = await fetch(`/api/admin/support/tickets/${ticket.id}/messages`);
      if (response.ok) {
        const messages = await response.json();
        setSelectedTicket(prev => prev?.id === ticket.id ? { ...prev, messages } : prev);
        // Also update in the tickets list
        setTickets(prevTickets =>
          prevTickets.map(t => t.id === ticket.id ? { ...t, messages } : t)
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSendingReply(true);
    try {
      const response = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage,
          isInternal: false
        })
      });

      if (response.ok) {
        const newMessage = await response.json();
        setSelectedTicket({
          ...selectedTicket,
          messages: [...selectedTicket.messages, newMessage]
        });
        setReplyMessage('');

        // Update ticket status to in_progress if it was new
        if (selectedTicket.status === 'new') {
          updateTicketStatus(selectedTicket.id, 'in_progress');
        }
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSendingReply(false);
    }
  };

  // Priority order for sorting
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  const statusOrder: Record<string, number> = { new: 0, in_progress: 1, waiting_on_customer: 2, resolved: 3, closed: 4 };

  const filteredTickets = tickets
    .filter(ticket => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        ticket.ticketNumber.toLowerCase().includes(search) ||
        ticket.customerName.toLowerCase().includes(search) ||
        ticket.customerEmail.toLowerCase().includes(search) ||
        ticket.subject.toLowerCase().includes(search) ||
        (ticket.orderId?.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'ticketNumber':
          comparison = a.ticketNumber.localeCompare(b.ticketNumber);
          break;
        case 'status':
          comparison = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
          break;
        case 'priority':
          comparison = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusDisplay = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    const Icon = config.icon;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: '600',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}40`
      }}>
        <Icon size={14} />
        {config.label || status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getPriorityDisplay = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
        background: config.bg,
        color: config.color,
        textTransform: 'uppercase'
      }}>
        {priority}
      </span>
    );
  };

  return (
    <div style={adminStyles.container}>
      <div style={adminStyles.content}>
        <div style={{ ...adminStyles.header, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={adminStyles.title}>Customer Support</h1>
            <p style={adminStyles.subtitle}>
              Manage support tickets and customer inquiries
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: isLive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
              borderRadius: '8px',
              border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
              cursor: 'pointer',
            }}
            onClick={() => setIsLive(!isLive)}
            title={isLive ? 'Click to pause auto-refresh' : 'Click to enable auto-refresh'}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isLive ? '#10b981' : '#6b7280',
                animation: isLive ? 'pulse 2s infinite' : 'none',
              }} />
              <span style={{ fontSize: '13px', color: isLive ? '#10b981' : '#6b7280', fontWeight: '500' }}>
                {isLive ? 'Live' : 'Paused'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {formatDistanceToNow(lastUpdate, { addSuffix: true })}
              </span>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#f97316',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                opacity: isRefreshing ? 0.7 : 1,
                fontWeight: '600',
                fontSize: '14px',
              }}
            >
              <RefreshCw size={16} style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
              }} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>New Tickets</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fde68a' }}>{stats.totalNew}</p>
              </div>
              <AlertCircle size={32} style={{ color: '#fbbf24' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>In Progress</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fde68a' }}>{stats.totalInProgress}</p>
              </div>
              <Clock size={32} style={{ color: '#3b82f6' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Resolved Today</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fde68a' }}>{stats.totalResolved}</p>
              </div>
              <CheckCircle size={32} style={{ color: '#10b981' }} />
            </div>
          </div>

          <div style={adminStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>Avg Response</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#fde68a' }}>
                  {stats.avgResponseTime}h
                </p>
              </div>
              <MessageSquare size={32} style={{ color: '#a78bfa' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 2fr' : '1fr', gap: '24px' }}>
          {/* Tickets List */}
          <div>
            {/* Filters */}
            <div style={{ ...adminStyles.section, marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={20} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#94a3b8'
                  }} />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      ...adminStyles.input,
                      paddingLeft: '44px',
                      width: '100%'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ ...adminStyles.input, flex: 1 }}
                  >
                    <option value="active">Open (Active)</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_on_customer">Waiting on Customer</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="all">All Status</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    style={{ ...adminStyles.input, flex: 1 }}
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Sorting */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    style={{ ...adminStyles.input, flex: 1 }}
                  >
                    <option value="createdAt">Date</option>
                    <option value="ticketNumber">Ticket #</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    style={{
                      ...adminStyles.input,
                      cursor: 'pointer',
                      padding: '8px 12px',
                      minWidth: '40px',
                      textAlign: 'center',
                    }}
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div style={{ ...adminStyles.section, maxHeight: '600px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <MessageSquare size={32} style={{ 
                    color: '#fdba74', 
                    marginBottom: '16px',
                    animation: 'pulse 2s infinite'
                  }} />
                  <p style={{ color: '#94a3b8' }}>Loading tickets...</p>
                </div>
              ) : filteredTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <MessageSquare size={32} style={{ color: '#94a3b8', marginBottom: '16px' }} />
                  <p style={{ color: '#94a3b8' }}>No tickets found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      style={{
                        padding: '16px',
                        background: selectedTicket?.id === ticket.id 
                          ? 'rgba(249, 115, 22, 0.1)' 
                          : 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '8px',
                        border: `2px solid ${selectedTicket?.id === ticket.id 
                          ? 'rgba(249, 115, 22, 0.5)' 
                          : 'transparent'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => selectTicket(ticket)}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <p style={{ 
                            fontWeight: '600', 
                            color: '#fde68a',
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            #{ticket.ticketNumber}
                          </p>
                          <p style={{ 
                            fontSize: '12px', 
                            color: '#94a3b8'
                          }}>
                            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {getPriorityDisplay(ticket.priority)}
                      </div>
                      
                      <h4 style={{ 
                        color: '#e2e8f0', 
                        fontSize: '15px',
                        marginBottom: '8px',
                        fontWeight: '600'
                      }}>
                        {ticket.subject}
                      </h4>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <p style={{ fontSize: '13px', color: '#e2e8f0' }}>
                            {ticket.customerName}
                          </p>
                          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {ticket.customerEmail}
                          </p>
                        </div>
                        {getStatusDisplay(ticket.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ticket Details */}
          {selectedTicket && (
            <div style={adminStyles.section}>
              <div style={{ 
                borderBottom: '2px solid rgba(249, 115, 22, 0.2)', 
                paddingBottom: '16px',
                marginBottom: '24px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h2 style={{ 
                      fontSize: '20px', 
                      fontWeight: 'bold', 
                      color: '#fdba74',
                      marginBottom: '8px'
                    }}>
                      {selectedTicket.subject}
                    </h2>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                        #{selectedTicket.ticketNumber}
                      </span>
                      <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                        {categoryConfig[selectedTicket.category as keyof typeof categoryConfig]?.label || selectedTicket.category}
                      </span>
                      {selectedTicket.orderId && (
                        <Link
                          href={`/admin/orders/${selectedTicket.orderId}`}
                          style={{ fontSize: '14px', color: '#fdba74', textDecoration: 'none' }}
                        >
                          Order: {selectedTicket.orderId.slice(0, 8)}...
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {getPriorityDisplay(selectedTicket.priority)}
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value)}
                      style={{
                        ...adminStyles.input,
                        padding: '6px 12px',
                        fontSize: '13px'
                      }}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_on_customer">Waiting on Customer</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(30, 41, 59, 0.5)', 
                  padding: '12px',
                  borderRadius: '8px'
                }}>
                  <p style={{ fontSize: '14px', color: '#e2e8f0', marginBottom: '4px' }}>
                    <strong>{selectedTicket.customerName}</strong> ({selectedTicket.customerEmail})
                  </p>
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                    Created {formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                marginBottom: '16px'
              }}>
                {selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      marginBottom: '16px',
                      padding: '16px',
                      background: message.senderType === 'customer'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgba(249, 115, 22, 0.1)',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${message.senderType === 'customer' ? '#3b82f6' : '#f97316'}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <p style={{
                        fontWeight: '600',
                        color: message.senderType === 'customer' ? '#3b82f6' : '#f97316',
                        fontSize: '14px'
                      }}>
                        {message.senderType === 'customer' ? selectedTicket.customerName : 'Support Team'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: '#e2e8f0',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {message.message}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <div style={{ 
                borderTop: '2px solid rgba(249, 115, 22, 0.2)', 
                paddingTop: '16px' 
              }}>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  style={{
                    ...adminStyles.input,
                    width: '100%',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={adminStyles.secondaryButton}
                      onClick={() => {
                        // TODO: Add internal note
                        addToast({ message: '📝 Internal notes coming soon!', type: 'info' });
                      }}
                    >
                      <Plus size={16} />
                      Internal Note
                    </button>
                  </div>
                  <button
                    style={{
                      ...adminStyles.primaryButton,
                      opacity: !replyMessage.trim() || sendingReply ? 0.5 : 1,
                      cursor: !replyMessage.trim() || sendingReply ? 'not-allowed' : 'pointer'
                    }}
                    onClick={sendReply}
                    disabled={!replyMessage.trim() || sendingReply}
                  >
                    <Send size={16} />
                    {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}