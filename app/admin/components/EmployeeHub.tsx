'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, Calendar, DollarSign, Award, FileText,
  TrendingUp, Shield, Coffee, Home, Car, Heart, 
  Briefcase, GraduationCap, Target, AlertCircle,
  CheckCircle, XCircle, Timer, PauseCircle, PlayCircle,
  UserPlus, UserX, Edit, Trash2, Download, Upload,
  Mail, Phone, MapPin, Building, CreditCard, 
  BarChart3, PieChart, Activity, Zap, Star,
  ChevronRight, ChevronDown, Search, Filter,
  Plus, Settings, Bell, Gift, Cake, Trophy
} from 'lucide-react';
import { adminStyles } from '../styles/adminStyles';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: 'engineering' | 'marketing' | 'sales' | 'operations' | 'finance' | 'hr' | 'executive';
  position: string;
  level: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'executive';
  status: 'active' | 'onLeave' | 'terminated' | 'onboarding';
  startDate: Date;
  birthday?: Date;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  compensation: {
    salary: number;
    bonus?: number;
    equity?: number;
    lastRaise?: Date;
  };
  timeOff: {
    vacation: { total: number; used: number; pending: number; };
    sick: { total: number; used: number; };
    personal: { total: number; used: number; };
  };
  performance: {
    lastReview?: Date;
    nextReview?: Date;
    rating?: 1 | 2 | 3 | 4 | 5;
    goals: Array<{
      title: string;
      progress: number;
      dueDate: Date;
    }>;
  };
  manager?: string;
  directReports?: string[];
  avatar?: string;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  date: Date;
  clockIn?: Date;
  clockOut?: Date;
  breakTime: number;
  totalHours: number;
  overtime: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'personal' | 'unpaid';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  notes?: string;
}

export default function EmployeeHub({ onNavigate }: { onNavigate: (view: any, label: string) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'directory' | 'timesheet' | 'payroll' | 'performance' | 'pto' | 'onboarding' | 'org'>('overview');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Mock data
  const employees: Employee[] = [
    {
      id: '1',
      employeeId: 'FUG-001',
      firstName: 'John',
      lastName: 'Chaos',
      email: 'john@fulluproar.com',
      phone: '555-0101',
      department: 'engineering',
      position: 'Senior Mayhem Engineer',
      level: 'senior',
      status: 'active',
      startDate: new Date('2023-01-15'),
      birthday: new Date('1990-05-20'),
      address: {
        street: '123 Mayhem Lane',
        city: 'Chaosvillle',
        state: 'CA',
        zip: '90210'
      },
      emergencyContact: {
        name: 'Jane Chaos',
        relationship: 'Spouse',
        phone: '555-0102'
      },
      compensation: {
        salary: 120000,
        bonus: 20000,
        equity: 0.5,
        lastRaise: new Date('2024-01-01')
      },
      timeOff: {
        vacation: { total: 15, used: 5, pending: 2 },
        sick: { total: 10, used: 2 },
        personal: { total: 3, used: 1 }
      },
      performance: {
        lastReview: new Date('2024-06-01'),
        nextReview: new Date('2024-12-01'),
        rating: 4,
        goals: [
          { title: 'Launch Afterroar+', progress: 75, dueDate: new Date('2024-12-31') },
          { title: 'Optimize checkout flow', progress: 100, dueDate: new Date('2024-09-30') }
        ]
      },
      directReports: ['2', '3']
    },
    {
      id: '2',
      employeeId: 'FUG-002',
      firstName: 'Sarah',
      lastName: 'Mayhem',
      email: 'sarah@fulluproar.com',
      phone: '555-0103',
      department: 'marketing',
      position: 'Marketing Chaos Coordinator',
      level: 'mid',
      status: 'active',
      startDate: new Date('2023-06-01'),
      address: {
        street: '456 Anarchy Ave',
        city: 'Disorderburg',
        state: 'CA',
        zip: '90211'
      },
      emergencyContact: {
        name: 'Mike Mayhem',
        relationship: 'Brother',
        phone: '555-0104'
      },
      compensation: {
        salary: 85000,
        bonus: 10000
      },
      timeOff: {
        vacation: { total: 12, used: 8, pending: 0 },
        sick: { total: 10, used: 1 },
        personal: { total: 3, used: 0 }
      },
      performance: {
        rating: 5,
        goals: [
          { title: 'Increase social engagement 50%', progress: 60, dueDate: new Date('2024-12-31') }
        ]
      },
      manager: '1'
    }
  ];

  // Mock time entries
  const mockTimeEntries: TimeEntry[] = [
    {
      id: '1',
      employeeId: '1',
      date: new Date(),
      clockIn: new Date(new Date().setHours(9, 0)),
      clockOut: new Date(new Date().setHours(18, 30)),
      breakTime: 60,
      totalHours: 8.5,
      overtime: 0.5,
      status: 'approved'
    }
  ];

  useEffect(() => {
    setTimeEntries(mockTimeEntries);
  }, []);

  const getDepartmentColor = (dept: string) => {
    const colors: any = {
      engineering: '#3b82f6',
      marketing: '#ec4899',
      sales: '#10b981',
      operations: '#FF8200',
      finance: '#7D55C7',
      hr: '#06b6d4',
      executive: '#fbbf24'
    };
    return colors[dept] || '#64748b';
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: '#10b981',
      onLeave: '#f59e0b',
      terminated: '#ef4444',
      onboarding: '#3b82f6'
    };
    return colors[status] || '#64748b';
  };

  const renderOverview = () => (
    <div>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(255, 130, 0, 0.1), rgba(255, 130, 0, 0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Users size={24} style={{ color: '#FF8200' }} />
            <span style={{ color: '#10b981', fontSize: '12px' }}>+12%</span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FBDB65', margin: '10px 0' }}>
            {employees.filter(e => e.status === 'active').length}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Active Employees</p>
        </div>

        <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Clock size={24} style={{ color: '#3b82f6' }} />
            <span style={{ color: '#10b981', fontSize: '12px' }}>On Track</span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FBDB65', margin: '10px 0' }}>
            98.5%
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Attendance Rate</p>
        </div>

        <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <DollarSign size={24} style={{ color: '#7D55C7' }} />
            <span style={{ color: '#f59e0b', fontSize: '12px' }}>Review</span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FBDB65', margin: '10px 0' }}>
            $2.4M
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Annual Payroll</p>
        </div>

        <div style={{ ...adminStyles.card, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Trophy size={24} style={{ color: '#10b981' }} />
            <span style={{ color: '#10b981', fontSize: '12px' }}>High</span>
          </div>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#FBDB65', margin: '10px 0' }}>
            4.2/5
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Avg Performance</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={adminStyles.card}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #FF8200, #ea580c)' }}>
            <UserPlus size={16} style={{ marginRight: '8px' }} />
            Add Employee
          </button>
          <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <Clock size={16} style={{ marginRight: '8px' }} />
            Review Timesheets
          </button>
          <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Calendar size={16} style={{ marginRight: '8px' }} />
            Approve PTO
          </button>
          <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #7D55C7, #7c3aed)' }}>
            <CreditCard size={16} style={{ marginRight: '8px' }} />
            Run Payroll
          </button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div style={adminStyles.card}>
          <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>
            <Cake size={20} style={{ marginRight: '8px', color: '#fbbf24' }} />
            Upcoming Birthdays
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {employees.slice(0, 3).map(emp => (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: `linear-gradient(135deg, ${getDepartmentColor(emp.department)}, ${getDepartmentColor(emp.department)}88)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#FBDB65', fontWeight: '500' }}>
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px' }}>
                    {emp.birthday ? new Date(emp.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'N/A'}
                  </div>
                </div>
                <Gift size={16} style={{ color: '#fbbf24' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={adminStyles.card}>
          <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>
            <Trophy size={20} style={{ marginRight: '8px', color: '#10b981' }} />
            Work Anniversaries
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {employees.slice(0, 3).map(emp => {
              const years = new Date().getFullYear() - emp.startDate.getFullYear();
              return (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px', 
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    fontWeight: 'bold'
                  }}>
                    {years}Y
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#FBDB65', fontWeight: '500' }}>
                      {emp.firstName} {emp.lastName}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      {emp.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <Award size={16} style={{ color: '#10b981' }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDirectory = () => (
    <div>
      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...adminStyles.input, paddingLeft: '40px' }}
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          style={adminStyles.select}
        >
          <option value="all">All Departments</option>
          <option value="engineering">Engineering</option>
          <option value="marketing">Marketing</option>
          <option value="sales">Sales</option>
          <option value="operations">Operations</option>
          <option value="finance">Finance</option>
          <option value="hr">HR</option>
        </select>
        <button 
          onClick={() => setShowEmployeeModal(true)}
          style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #FF8200, #ea580c)' }}
        >
          <Plus size={16} style={{ marginRight: '8px' }} />
          Add Employee
        </button>
      </div>

      {/* Employee Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {employees
          .filter(emp => filterDepartment === 'all' || emp.department === filterDepartment)
          .filter(emp => 
            searchTerm === '' || 
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(emp => (
            <div 
              key={emp.id} 
              style={{ 
                ...adminStyles.card, 
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: '2px solid transparent'
              }}
              onClick={() => setSelectedEmployee(emp)}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#FF8200'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: `linear-gradient(135deg, ${getDepartmentColor(emp.department)}, ${getDepartmentColor(emp.department)}88)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#FBDB65', fontSize: '18px', marginBottom: '4px' }}>
                    {emp.firstName} {emp.lastName}
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
                    {emp.position}
                  </p>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    background: `${getStatusColor(emp.status)}22`,
                    color: getStatusColor(emp.status),
                    fontSize: '12px',
                    textTransform: 'capitalize'
                  }}>
                    {emp.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                  <Mail size={14} />
                  {emp.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                  <Phone size={14} />
                  {emp.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                  <Building size={14} />
                  <span style={{ textTransform: 'capitalize' }}>{emp.department}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                  <Calendar size={14} />
                  Started {emp.startDate.toLocaleDateString()}
                </div>
              </div>

              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>PTO Balance</span>
                  <span style={{ color: '#10b981' }}>
                    {emp.timeOff.vacation.total - emp.timeOff.vacation.used} days
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
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
            border: '2px solid rgba(255, 130, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: '#FBDB65', fontSize: '24px' }}>
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </h2>
              <button 
                onClick={() => setSelectedEmployee(null)}
                style={adminStyles.iconButton}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Personal Info */}
              <div>
                <h3 style={{ color: '#FBDB65', fontSize: '16px', marginBottom: '15px' }}>Personal Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div><strong style={{ color: '#94a3b8' }}>Employee ID:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.employeeId}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Email:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.email}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Phone:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.phone}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Birthday:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.birthday?.toLocaleDateString() || 'N/A'}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Address:</strong> <span style={{ color: '#e2e8f0' }}>
                    {selectedEmployee.address.street}, {selectedEmployee.address.city}, {selectedEmployee.address.state} {selectedEmployee.address.zip}
                  </span></div>
                </div>
              </div>

              {/* Work Info */}
              <div>
                <h3 style={{ color: '#FBDB65', fontSize: '16px', marginBottom: '15px' }}>Work Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div><strong style={{ color: '#94a3b8' }}>Department:</strong> <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{selectedEmployee.department}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Position:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.position}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Level:</strong> <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>{selectedEmployee.level}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Start Date:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.startDate.toLocaleDateString()}</span></div>
                  <div><strong style={{ color: '#94a3b8' }}>Status:</strong> <span style={{ 
                    color: getStatusColor(selectedEmployee.status),
                    textTransform: 'capitalize'
                  }}>{selectedEmployee.status}</span></div>
                </div>
              </div>

              {/* Compensation */}
              <div>
                <h3 style={{ color: '#FBDB65', fontSize: '16px', marginBottom: '15px' }}>Compensation</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div><strong style={{ color: '#94a3b8' }}>Salary:</strong> <span style={{ color: '#10b981' }}>${selectedEmployee.compensation.salary.toLocaleString()}</span></div>
                  {selectedEmployee.compensation.bonus && (
                    <div><strong style={{ color: '#94a3b8' }}>Bonus:</strong> <span style={{ color: '#10b981' }}>${selectedEmployee.compensation.bonus.toLocaleString()}</span></div>
                  )}
                  {selectedEmployee.compensation.equity && (
                    <div><strong style={{ color: '#94a3b8' }}>Equity:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.compensation.equity}%</span></div>
                  )}
                  {selectedEmployee.compensation.lastRaise && (
                    <div><strong style={{ color: '#94a3b8' }}>Last Raise:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.compensation.lastRaise.toLocaleDateString()}</span></div>
                  )}
                </div>
              </div>

              {/* Time Off */}
              <div>
                <h3 style={{ color: '#FBDB65', fontSize: '16px', marginBottom: '15px' }}>Time Off Balance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px' }}>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Vacation:</strong>{' '}
                    <span style={{ color: '#e2e8f0' }}>
                      {selectedEmployee.timeOff.vacation.total - selectedEmployee.timeOff.vacation.used} days available
                      ({selectedEmployee.timeOff.vacation.used} used)
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Sick:</strong>{' '}
                    <span style={{ color: '#e2e8f0' }}>
                      {selectedEmployee.timeOff.sick.total - selectedEmployee.timeOff.sick.used} days available
                      ({selectedEmployee.timeOff.sick.used} used)
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: '#94a3b8' }}>Personal:</strong>{' '}
                    <span style={{ color: '#e2e8f0' }}>
                      {selectedEmployee.timeOff.personal.total - selectedEmployee.timeOff.personal.used} days available
                      ({selectedEmployee.timeOff.personal.used} used)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              <h3 style={{ color: '#ef4444', fontSize: '16px', marginBottom: '10px' }}>
                <AlertCircle size={16} style={{ marginRight: '8px' }} />
                Emergency Contact
              </h3>
              <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                <div><strong style={{ color: '#94a3b8' }}>Name:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.emergencyContact.name}</span></div>
                <div><strong style={{ color: '#94a3b8' }}>Relationship:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.emergencyContact.relationship}</span></div>
                <div><strong style={{ color: '#94a3b8' }}>Phone:</strong> <span style={{ color: '#e2e8f0' }}>{selectedEmployee.emergencyContact.phone}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTimesheet = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...adminStyles.sectionTitle, margin: 0 }}>
          <Clock size={24} style={{ marginRight: '10px', color: '#FF8200' }} />
          Time Tracking
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={adminStyles.button}>
            <ChevronDown size={16} style={{ marginRight: '8px' }} />
            Export Timesheets
          </button>
          <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <CheckCircle size={16} style={{ marginRight: '8px' }} />
            Approve All
          </button>
        </div>
      </div>

      {/* Current Week Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '30px' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
          <div key={day} style={adminStyles.card}>
            <h4 style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '10px', textAlign: 'center' }}>{day}</h4>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: idx < 5 ? '#10b981' : '#64748b' }}>
                {idx < 3 ? '8.5' : idx < 5 ? '8.0' : '0'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>hours</div>
            </div>
          </div>
        ))}
      </div>

      {/* Time Entries Table */}
      <div style={adminStyles.card}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Recent Time Entries</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 130, 0, 0.3)' }}>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Employee</th>
                <th style={adminStyles.tableHeader}>Date</th>
                <th style={adminStyles.tableHeader}>Clock In</th>
                <th style={adminStyles.tableHeader}>Clock Out</th>
                <th style={adminStyles.tableHeader}>Break</th>
                <th style={adminStyles.tableHeader}>Total</th>
                <th style={adminStyles.tableHeader}>Overtime</th>
                <th style={adminStyles.tableHeader}>Status</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map(entry => {
                const employee = employees.find(e => e.id === entry.employeeId);
                return (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: `linear-gradient(135deg, ${getDepartmentColor(employee?.department || '')}, ${getDepartmentColor(employee?.department || '')}88)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {employee?.firstName[0]}{employee?.lastName[0]}
                        </div>
                        <div>
                          <div style={{ color: '#FBDB65', fontSize: '14px' }}>
                            {employee?.firstName} {employee?.lastName}
                          </div>
                          <div style={{ color: '#64748b', fontSize: '12px' }}>
                            {employee?.position}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={adminStyles.tableCell}>
                      {entry.date.toLocaleDateString()}
                    </td>
                    <td style={adminStyles.tableCell}>
                      {entry.clockIn?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={adminStyles.tableCell}>
                      {entry.clockOut?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={adminStyles.tableCell}>
                      {entry.breakTime} min
                    </td>
                    <td style={{ ...adminStyles.tableCell, color: '#10b981', fontWeight: 'bold' }}>
                      {entry.totalHours} hrs
                    </td>
                    <td style={{ ...adminStyles.tableCell, color: entry.overtime > 0 ? '#f59e0b' : '#64748b' }}>
                      {entry.overtime > 0 ? `+${entry.overtime}` : '-'}
                    </td>
                    <td style={adminStyles.tableCell}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px',
                        background: entry.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 
                                  entry.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' :
                                  'rgba(245, 158, 11, 0.2)',
                        color: entry.status === 'approved' ? '#10b981' : 
                              entry.status === 'rejected' ? '#ef4444' :
                              '#f59e0b',
                        fontSize: '12px',
                        textTransform: 'capitalize'
                      }}>
                        {entry.status}
                      </span>
                    </td>
                    <td style={adminStyles.tableCell}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button style={{ ...adminStyles.iconButton, color: '#10b981' }}>
                          <CheckCircle size={16} />
                        </button>
                        <button style={{ ...adminStyles.iconButton, color: '#ef4444' }}>
                          <XCircle size={16} />
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
    </div>
  );

  const renderPayroll = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...adminStyles.sectionTitle, margin: 0 }}>
          <DollarSign size={24} style={{ marginRight: '10px', color: '#10b981' }} />
          Payroll Management
        </h2>
        <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <CreditCard size={16} style={{ marginRight: '8px' }} />
          Run Payroll
        </button>
      </div>

      {/* Payroll Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={adminStyles.card}>
          <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Current Period</h4>
          <div style={{ color: '#FBDB65', fontSize: '24px', fontWeight: 'bold' }}>$198,500</div>
          <div style={{ color: '#10b981', fontSize: '12px', marginTop: '5px' }}>↑ 5.2% from last period</div>
        </div>
        <div style={adminStyles.card}>
          <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>YTD Total</h4>
          <div style={{ color: '#FBDB65', fontSize: '24px', fontWeight: 'bold' }}>$2.4M</div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>Annual projection: $2.88M</div>
        </div>
        <div style={adminStyles.card}>
          <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Taxes & Benefits</h4>
          <div style={{ color: '#FBDB65', fontSize: '24px', fontWeight: 'bold' }}>$42,300</div>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '5px' }}>21.3% of gross</div>
        </div>
        <div style={adminStyles.card}>
          <h4 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Next Payroll</h4>
          <div style={{ color: '#FBDB65', fontSize: '24px', fontWeight: 'bold' }}>Dec 15</div>
          <div style={{ color: '#f59e0b', fontSize: '12px', marginTop: '5px' }}>In 3 days</div>
        </div>
      </div>

      {/* Compensation Overview */}
      <div style={adminStyles.card}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Employee Compensation</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 130, 0, 0.3)' }}>
                <th style={{ ...adminStyles.tableHeader, textAlign: 'left' }}>Employee</th>
                <th style={adminStyles.tableHeader}>Base Salary</th>
                <th style={adminStyles.tableHeader}>Bonus</th>
                <th style={adminStyles.tableHeader}>Benefits</th>
                <th style={adminStyles.tableHeader}>Total Comp</th>
                <th style={adminStyles.tableHeader}>Last Raise</th>
                <th style={adminStyles.tableHeader}>Next Review</th>
                <th style={adminStyles.tableHeader}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <td style={{ ...adminStyles.tableCell, textAlign: 'left' }}>
                    <div>
                      <div style={{ color: '#FBDB65' }}>{emp.firstName} {emp.lastName}</div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>{emp.position}</div>
                    </div>
                  </td>
                  <td style={{ ...adminStyles.tableCell, color: '#10b981' }}>
                    ${emp.compensation.salary.toLocaleString()}
                  </td>
                  <td style={adminStyles.tableCell}>
                    ${(emp.compensation.bonus || 0).toLocaleString()}
                  </td>
                  <td style={adminStyles.tableCell}>
                    ${Math.floor(emp.compensation.salary * 0.25).toLocaleString()}
                  </td>
                  <td style={{ ...adminStyles.tableCell, color: '#FBDB65', fontWeight: 'bold' }}>
                    ${(emp.compensation.salary + (emp.compensation.bonus || 0) + Math.floor(emp.compensation.salary * 0.25)).toLocaleString()}
                  </td>
                  <td style={adminStyles.tableCell}>
                    {emp.compensation.lastRaise?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td style={adminStyles.tableCell}>
                    {emp.performance.nextReview?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td style={adminStyles.tableCell}>
                    <button style={{ ...adminStyles.iconButton, color: '#FF8200' }}>
                      <Edit size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div>
      <h2 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>
        <TrendingUp size={24} style={{ marginRight: '10px', color: '#7D55C7' }} />
        Performance Management
      </h2>

      {/* Performance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px' }}>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = employees.filter(e => e.performance.rating === rating).length;
          const percentage = (count / employees.length) * 100;
          return (
            <div key={rating} style={adminStyles.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                {[...Array(rating)].map((_, i) => (
                  <Star key={i} size={16} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                ))}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FBDB65' }}>
                {count}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {percentage.toFixed(0)}% of team
              </div>
            </div>
          );
        })}
      </div>

      {/* Goals & Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={adminStyles.card}>
          <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Upcoming Reviews</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {employees
              .filter(e => e.performance.nextReview)
              .sort((a, b) => (a.performance.nextReview?.getTime() || 0) - (b.performance.nextReview?.getTime() || 0))
              .slice(0, 5)
              .map(emp => (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Calendar size={20} style={{ color: '#7D55C7' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#FBDB65' }}>{emp.firstName} {emp.lastName}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>
                      {emp.performance.nextReview?.toLocaleDateString()}
                    </div>
                  </div>
                  <button style={{ ...adminStyles.iconButton, color: '#7D55C7' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div style={adminStyles.card}>
          <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Active Goals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {employees.flatMap(emp => 
              emp.performance.goals.map((goal, idx) => ({
                ...goal,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                key: `${emp.id}-${idx}`
              }))
            ).slice(0, 5).map(goal => (
              <div key={goal.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#FBDB65', fontSize: '14px' }}>{goal.title}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{goal.employeeName}</div>
                  </div>
                  <span style={{ color: '#7D55C7', fontSize: '14px', fontWeight: 'bold' }}>
                    {goal.progress}%
                  </span>
                </div>
                <div style={{ 
                  height: '4px', 
                  background: 'rgba(139, 92, 246, 0.2)', 
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${goal.progress}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #7D55C7, #a78bfa)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPTO = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ ...adminStyles.sectionTitle, margin: 0 }}>
          <Calendar size={24} style={{ marginRight: '10px', color: '#06b6d4' }} />
          PTO & Leave Management
        </h2>
        <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Request Time Off
        </button>
      </div>

      {/* PTO Calendar View */}
      <div style={{ ...adminStyles.card, marginBottom: '20px' }}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>December 2024 - Team Calendar</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{ 
              padding: '10px', 
              textAlign: 'center', 
              color: '#94a3b8',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              {day}
            </div>
          ))}
          {[...Array(31)].map((_, i) => (
            <div key={i} style={{ 
              padding: '15px 10px', 
              background: 'rgba(148, 163, 184, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              minHeight: '60px'
            }}>
              <div style={{ color: '#e2e8f0', fontSize: '14px', marginBottom: '5px' }}>{i + 1}</div>
              {i === 14 && (
                <div style={{ 
                  fontSize: '10px', 
                  padding: '2px 4px', 
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  borderRadius: '4px'
                }}>
                  JC - Vacation
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Requests */}
      <div style={adminStyles.card}>
        <h3 style={{ ...adminStyles.sectionTitle, marginBottom: '20px' }}>Pending Leave Requests</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ 
            padding: '15px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <h4 style={{ color: '#FBDB65', marginBottom: '5px' }}>Sarah Mayhem</h4>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Vacation Request</p>
              </div>
              <span style={{ 
                padding: '4px 8px',
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                Pending
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#e2e8f0', marginBottom: '10px' }}>
              <span><Calendar size={14} style={{ marginRight: '5px' }} />Dec 20 - Dec 27, 2024</span>
              <span><Clock size={14} style={{ marginRight: '5px' }} />5 days</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '15px' }}>
              Holiday vacation with family
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #10b981, #059669)', flex: 1 }}>
                <CheckCircle size={16} style={{ marginRight: '8px' }} />
                Approve
              </button>
              <button style={{ ...adminStyles.button, background: 'linear-gradient(135deg, #ef4444, #dc2626)', flex: 1 }}>
                <XCircle size={16} style={{ marginRight: '8px' }} />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={adminStyles.container}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={adminStyles.title}>
          Employee Hub
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Complete HR management system for the Fugly workforce
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Home size={16} /> },
          { id: 'directory', label: 'Directory', icon: <Users size={16} /> },
          { id: 'timesheet', label: 'Timesheet', icon: <Clock size={16} /> },
          { id: 'payroll', label: 'Payroll', icon: <DollarSign size={16} /> },
          { id: 'performance', label: 'Performance', icon: <TrendingUp size={16} /> },
          { id: 'pto', label: 'PTO', icon: <Calendar size={16} /> },
          { id: 'onboarding', label: 'Onboarding', icon: <UserPlus size={16} /> },
          { id: 'org', label: 'Org Chart', icon: <Building size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              ...adminStyles.button,
              background: activeTab === tab.id ? 
                'linear-gradient(135deg, #FF8200, #ea580c)' : 
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
      {activeTab === 'directory' && renderDirectory()}
      {activeTab === 'timesheet' && renderTimesheet()}
      {activeTab === 'payroll' && renderPayroll()}
      {activeTab === 'performance' && renderPerformance()}
      {activeTab === 'pto' && renderPTO()}
      {activeTab === 'onboarding' && (
        <div style={adminStyles.card}>
          <h3 style={adminStyles.sectionTitle}>Onboarding Pipeline</h3>
          <p style={{ color: '#94a3b8' }}>New employee onboarding workflows and checklists coming soon...</p>
        </div>
      )}
      {activeTab === 'org' && (
        <div style={adminStyles.card}>
          <h3 style={adminStyles.sectionTitle}>Organization Chart</h3>
          <p style={{ color: '#94a3b8' }}>Interactive org chart visualization coming soon...</p>
        </div>
      )}
    </div>
  );
}