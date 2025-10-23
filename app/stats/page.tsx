'use client';

import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalFailed: 0,
    totalRecovered: 0,
    revenueRecovered: 0,
    recoveryRate: 0,
    emailsSent: 0
  });

  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Mock data since Supabase is commented out
      const mockFailedPayments = [
        { id: 1, user_email: 'user1@example.com', amount: 1000, currency: 'usd', status: 'active', payments_failed_count: 1, created_at: new Date().toISOString() },
        { id: 2, user_email: 'user2@example.com', amount: 2000, currency: 'usd', status: 'recovered', payments_failed_count: 2, created_at: new Date(Date.now() - 86400000).toISOString() },
      ];
      const mockEmails = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const total = mockFailedPayments.length || 0;
      const recovered = mockFailedPayments.filter(p => p.status === 'recovered').length || 0;
      const revenue = mockFailedPayments
        .filter(p => p.status === 'recovered')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      setStats({
        totalFailed: total,
        totalRecovered: recovered,
        revenueRecovered: revenue / 100,
        recoveryRate: total > 0 ? (recovered / total) * 100 : 0,
        emailsSent: mockEmails.length || 0
      });

      setRecentPayments(mockFailedPayments.slice(0, 10) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Recovery Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Monitor and manage failed payment recovery for your Whop community
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Failed Payments" 
            value={stats.totalFailed}
            trend="+2 this week"
            color="error"
            icon={<AlertTriangle className="w-5 h-5" />}
            delay={0}
          />
          <StatCard 
            title="Recovered" 
            value={stats.totalRecovered}
            trend="+1 this week"
            color="success"
            icon={<CheckCircle className="w-5 h-5" />}
            delay={100}
          />
          <StatCard 
            title="Revenue Recovered" 
            value={`$${stats.revenueRecovered.toFixed(2)}`}
            trend="+$20.00 this week"
            color="brand"
            icon={<DollarSign className="w-5 h-5" />}
            delay={200}
          />
          <StatCard 
            title="Recovery Rate" 
            value={`${stats.recoveryRate.toFixed(1)}%`}
            trend="+5.2% this week"
            color="warning"
            icon={<TrendingUp className="w-5 h-5" />}
            delay={300}
          />
        </div>

        {/* Recent Payments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden animate-slide-up">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Failed Payments</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Track payment recovery progress</p>
          </div>
          
          {recentPayments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentPayments.map((payment, index) => (
                    <PaymentRow 
                      key={payment.id} 
                      payment={payment} 
                      index={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mt-8 animate-fade-in">
          <HowItWorks />
        </div>
      </div>
    </div>
  );
}

// Loading State Component
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 dark:text-gray-300">Loading dashboard...</p>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  trend, 
  color, 
  icon, 
  delay 
}: {
  title: string;
  value: string | number;
  trend: string;
  color: 'error' | 'success' | 'brand' | 'warning';
  icon: React.ReactNode;
  delay: number;
}) {
  const colorClasses = {
    error: 'bg-error-50 border-error-200 text-error-700 dark:bg-error-900/20 dark:border-error-800 dark:text-error-400',
    success: 'bg-success-50 border-success-200 text-success-700 dark:bg-success-900/20 dark:border-success-800 dark:text-success-400',
    brand: 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-900/20 dark:border-brand-800 dark:text-brand-400',
    warning: 'bg-warning-50 border-warning-200 text-warning-700 dark:bg-warning-900/20 dark:border-warning-800 dark:text-warning-400',
  };

  return (
    <div 
      className={`${colorClasses[color]} border rounded-xl p-6 hover:shadow-medium dark:hover:shadow-strong transition-all duration-200 animate-scale-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            {icon}
          </div>
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs opacity-75">{trend}</p>
      </div>
    </div>
  );
}

// Payment Row Component
function PaymentRow({ payment, index }: { payment: any; index: number }) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        color: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400', 
        label: 'Active' 
      },
      recovered: { 
        color: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400', 
        label: 'Recovered' 
      },
      cancelled: { 
        color: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-400', 
        label: 'Cancelled' 
      },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <tr 
      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {payment.user_email.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{payment.user_email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(payment.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
        {payment.payments_failed_count || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {new Date(payment.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button className="text-brand-600 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
          View Details
        </button>
      </td>
    </tr>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto h-24 w-24 text-gray-400 dark:text-gray-500 mb-4">
        <CheckCircle className="h-24 w-24" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No failed payments</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        Great news! All payments are processing successfully. Failed payments will appear here when they occur.
      </p>
    </div>
  );
}

// How It Works Component
function HowItWorks() {
  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Automatic Detection",
      description: "Webhooks instantly detect failed payments and trigger recovery workflows"
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Smart Email Sequences", 
      description: "Automated email campaigns remind customers to update payment methods"
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Revenue Recovery",
      description: "Track recovered revenue and optimize your recovery strategies"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Analytics & Insights",
      description: "Monitor recovery rates and identify patterns to improve success"
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How It Works</h3>
        <p className="text-gray-600 dark:text-gray-300">Automated payment recovery made simple</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="text-center p-6 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg mb-4">
              {feature.icon}
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Icons (you'll need to install lucide-react or use your preferred icon library)
const AlertTriangle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DollarSign = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Mail = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const BarChart3 = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);