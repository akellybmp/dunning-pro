'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  CheckCircle, 
  DollarSign, 
  TrendingUp,
  Zap,
  Mail,
  BarChart3,
  ArrowRight
} from 'lucide-react';

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
      setLoading(true);
      
      // Fetch stats from API
      const statsResponse = await fetch('/api/stats?companyId=default');
      const statsData = await statsResponse.json();

      if (!statsResponse.ok) {
        throw new Error(statsData.error || 'Failed to fetch stats');
      }

      setStats({
        totalFailed: statsData.stats.totalFailed,
        totalRecovered: statsData.stats.recovered,
        revenueRecovered: statsData.stats.recoveredRevenue / 100,
        recoveryRate: statsData.stats.recoveryRate,
        emailsSent: statsData.stats.emailsSent || 0
      });

      setRecentPayments(statsData.recentPayments || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data on error
      setStats({
        totalFailed: 0,
        totalRecovered: 0,
        revenueRecovered: 0,
        recoveryRate: 0,
        emailsSent: 0
      });
      setRecentPayments([]);
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
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              View All Payments
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
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
  // Light mode classes (original design)
  const lightModeClasses = {
    error: 'bg-red-50 border-2 border-red-600 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    brand: 'bg-blue-50 border-blue-200 text-blue-700',
    warning: 'bg-orange-50 border-orange-200 text-orange-700',
  };

  // Dark mode classes (inverted design)
  const darkModeClasses = {
    error: 'dark:bg-red-900 dark:border-2 dark:border-red-400 dark:text-red-100',
    success: 'dark:bg-green-900 dark:border-green-700 dark:text-green-100',
    brand: 'dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100',
    warning: 'dark:bg-orange-900 dark:border-orange-700 dark:text-orange-100',
  };

  const getCardClasses = (color: string) => {
    const lightClass = lightModeClasses[color as keyof typeof lightModeClasses];
    const darkClass = darkModeClasses[color as keyof typeof darkModeClasses];
    return `${lightClass} ${darkClass}`;
  };

  // Special styling for specific cards
  const getCardStyle = (color: string) => {
    if (color === 'error') {
      return {
        animationDelay: `${delay}ms`,
        border: '2px solid #dc2626', // Red border for Failed Payments
        borderColor: '#dc2626'
      };
    }
    if (color === 'success') {
      return {
        animationDelay: `${delay}ms`,
        border: '2px solid #2563eb', // Blue border for Recovered
        borderColor: '#2563eb'
      };
    }
    if (color === 'brand') {
      return {
        animationDelay: `${delay}ms`,
        border: '2px solid #16a34a', // Green border for Revenue Recovered
        borderColor: '#16a34a'
      };
    }
    if (color === 'warning') {
      return {
        animationDelay: `${delay}ms`,
        border: '2px solid #f97316', // Brighter orange border for Recovery Rate
        borderColor: '#f97316'
      };
    }
    return { animationDelay: `${delay}ms` };
  };

  return (
    <div 
      className={`${getCardClasses(color)} border rounded-xl p-6 hover:shadow-medium dark:hover:shadow-strong transition-all duration-200 animate-scale-in`}
      style={getCardStyle(color)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-white/50 dark:bg-white/10 rounded-lg">
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
            color: 'bg-warning-100 text-warning-900 dark:bg-warning-100 dark:text-black',
            label: 'Active'
          },
      recovered: { 
        color: 'bg-success-100 text-success-800 dark:bg-success-100 dark:text-black', 
        label: 'Recovered' 
      },
      cancelled: { 
        color: 'bg-error-100 text-error-800 dark:bg-error-100 dark:text-black', 
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
