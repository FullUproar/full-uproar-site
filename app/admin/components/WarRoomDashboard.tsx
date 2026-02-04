'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign, Users, ShoppingCart, TrendingUp, Eye, Heart,
  MessageCircle, Share2, Target, Zap, Trophy, Calendar,
  Package, Clock, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function MetricCard({ title, value, change, icon, color, subtitle }: MetricCardProps) {
  const changeIcon = change && change > 0 ? <ArrowUp size={16} /> :
                     change && change < 0 ? <ArrowDown size={16} /> :
                     <Minus size={16} />;
  const changeColor = change && change > 0 ? '#10b981' :
                      change && change < 0 ? '#ef4444' :
                      '#6b7280';

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.95)',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              {title}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: color, lineHeight: 1 }}>
              {value}
            </div>
            {subtitle && (
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ color: color, opacity: 0.8 }}>
            {icon}
          </div>
        </div>

        {change !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.875rem',
            color: changeColor,
            fontWeight: 'bold'
          }}>
            {changeIcon}
            <span>{Math.abs(change)}%</span>
            <span style={{ color: '#64748b', marginLeft: '0.25rem' }}>vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProgressGoalProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

function ProgressGoal({ label, current, target, color }: ProgressGoalProps) {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{label}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: color }}>
          {current} / {target}
        </span>
      </div>
      <div style={{
        height: '8px',
        background: 'rgba(15, 23, 42, 0.8)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
          transition: 'width 0.5s ease',
          boxShadow: `0 0 10px ${color}80`
        }} />
      </div>
    </div>
  );
}

export default function WarRoomDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data - replace with real API calls later
  const metrics = {
    revenue: {
      total: '$12,450',
      change: 23.5,
      subtitle: 'Last 30 days'
    },
    orders: {
      total: 47,
      change: 15.2,
      subtitle: 'This month'
    },
    visitors: {
      total: '3,842',
      change: 8.7,
      subtitle: 'Unique visitors'
    },
    conversion: {
      total: '3.2%',
      change: -1.2,
      subtitle: 'Conv. rate'
    }
  };

  const socialStats = [
    { platform: 'Instagram', followers: '2.4K', engagement: '4.2%', color: '#E4405F' },
    { platform: 'Twitter', followers: '1.8K', engagement: '2.8%', color: '#1DA1F2' },
    { platform: 'TikTok', followers: '5.1K', engagement: '6.7%', color: '#000000' },
    { platform: 'Discord', members: '342', active: '89', color: '#5865F2' },
  ];

  const goals = [
    { label: 'Monthly Revenue Goal', current: 12450, target: 20000, color: '#10b981' },
    { label: 'New Customers', current: 23, target: 50, color: '#3b82f6' },
    { label: 'Waitlist Signups', current: 127, target: 200, color: '#FF8200' },
    { label: 'Game Nights Hosted', current: 8, target: 15, color: '#7D55C7' },
  ];

  const recentActivity = [
    { type: 'order', text: 'New order #1234 - $89.99', time: '2 min ago', color: '#10b981' },
    { type: 'signup', text: 'New waitlist signup', time: '5 min ago', color: '#FF8200' },
    { type: 'gamenight', text: 'Game night RSVP - 4 attendees', time: '12 min ago', color: '#7D55C7' },
    { type: 'social', text: 'Instagram post - 42 likes', time: '1 hr ago', color: '#E4405F' },
    { type: 'order', text: 'New order #1233 - $124.99', time: '2 hrs ago', color: '#10b981' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '2rem',
      color: '#e2e8f0'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid rgba(255, 130, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#FF8200',
              marginBottom: '0.5rem',
              textShadow: '0 0 20px rgba(255, 130, 0, 0.5)'
            }}>
              WAR ROOM
            </h1>
            <p style={{ fontSize: '1rem', color: '#94a3b8' }}>
              Full Uproar Command Center
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FBDB65' }}>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <MetricCard
          title="Total Revenue"
          value={metrics.revenue.total}
          change={metrics.revenue.change}
          subtitle={metrics.revenue.subtitle}
          icon={<DollarSign size={32} />}
          color="#10b981"
        />
        <MetricCard
          title="Orders"
          value={metrics.orders.total}
          change={metrics.orders.change}
          subtitle={metrics.orders.subtitle}
          icon={<ShoppingCart size={32} />}
          color="#3b82f6"
        />
        <MetricCard
          title="Visitors"
          value={metrics.visitors.total}
          change={metrics.visitors.change}
          subtitle={metrics.visitors.subtitle}
          icon={<Users size={32} />}
          color="#FF8200"
        />
        <MetricCard
          title="Conversion Rate"
          value={metrics.conversion.total}
          change={metrics.conversion.change}
          subtitle={metrics.conversion.subtitle}
          icon={<TrendingUp size={32} />}
          color="#7D55C7"
        />
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Goals & Progress */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(255, 130, 0, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <Trophy size={24} style={{ color: '#FF8200' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FF8200' }}>
              Monthly Goals
            </h2>
          </div>

          {goals.map((goal, idx) => (
            <ProgressGoal key={idx} {...goal} />
          ))}
        </div>

        {/* Social Stats */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(255, 130, 0, 0.3)',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <Share2 size={24} style={{ color: '#FF8200' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FF8200' }}>
              Social Media
            </h2>
          </div>

          {socialStats.map((stat, idx) => (
            <div key={idx} style={{
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              marginBottom: '0.75rem',
              borderLeft: `4px solid ${stat.color}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{stat.platform}</span>
                <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                  {stat.followers || stat.members}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {stat.engagement ? `${stat.engagement} engagement` : `${stat.active} active`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        border: '2px solid rgba(255, 130, 0, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <Zap size={24} style={{ color: '#FF8200' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FF8200' }}>
            Live Activity Feed
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {recentActivity.map((activity, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.75rem',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '8px',
              borderLeft: `4px solid ${activity.color}`
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activity.color,
                boxShadow: `0 0 10px ${activity.color}`
              }} />
              <div style={{ flex: 1 }}>
                <span style={{ color: '#e2e8f0' }}>{activity.text}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Avg Order Value
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            $264.89
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Cart Abandonment
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            12.4%
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(255, 130, 0, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Email Open Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FF8200' }}>
            32.1%
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Active Game Nights
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7D55C7' }}>
            8
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(236, 72, 153, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Forum Posts
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
            156
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '2px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Mod Queue
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#eab308' }}>
            3
          </div>
        </div>
      </div>
    </div>
  );
}
