'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Mail,
  Copy,
  Send,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Settings,
  ArrowRight
} from 'lucide-react';

interface Payment {
  id: string;
  user_email: string;
  membership_id: string;
  amount: number;
  payments_failed_count: number;
  status: string;
  emails_sent: number;
  last_email_sent: string | null;
  auto_email_enabled: boolean;
  created_at: string;
}

export default function PaymentsSettings() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Fetch payments data
	useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  // Debounced search effect
  useEffect(() => {
    // Don't search if searchTerm is empty
    if (searchTerm.trim() === '') {
      fetchPayments();
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log('🔍 Searching for:', searchTerm);
      fetchPayments();
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchPayments = async () => {
    try {
      console.log('🔄 Fetching payments...');
      setLoading(true);
      setError(null); // Clear previous errors
      
      const params = new URLSearchParams({
        companyId: 'default',
        status: statusFilter,
        search: searchTerm,
        page: '1',
        limit: '50'
      });

      console.log('📡 Making API call to /api/payments with params:', params.toString());
      const response = await fetch(`/api/payments?${params}`);
      console.log('📡 Payments API response status:', response.status);
      
      const data = await response.json();
      console.log('📡 Payments API response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payments');
      }

      setPayments(data.payments || []);
      console.log('✅ Payments loaded:', data.payments?.length || 0, 'payments');
    } catch (err) {
      console.error('❌ Error fetching payments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(errorMessage);
      
      // If it's a database connection error, provide helpful guidance
      if (errorMessage.includes('Database not configured') || errorMessage.includes('Failed to fetch payments')) {
        setError('Database connection failed. Please check your Supabase configuration and run the database setup script.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'enable_auto_email' | 'disable_auto_email') => {
    if (selectedRows.length === 0) return;

    try {
      const response = await fetch('/api/payments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds: selectedRows,
          updates: {
            auto_email_enabled: action === 'enable_auto_email'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update payments');
      }

      // Refresh data
      await fetchPayments();
      setSelectedRows([]);
    } catch (err) {
      console.error('Bulk action error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update payments');
    }
  };

  const handleSendEmail = async (template: any) => {
    console.log('🔘 Send Email button clicked');
    
    if (!selectedPayment) {
      console.error('❌ No payment selected for email');
      setError('No payment selected for email');
      return;
    }

    try {
      console.log('🧪 Starting email send process...');
      console.log('📧 Selected payment:', selectedPayment);
      console.log('📧 Template:', template);
      
      setSendingEmail(true);
      setError(null);
      setEmailSuccess(null);
      
      // Close the modal first
      setShowEmailModal(false);
      console.log('📧 Modal closed, sending email to:', selectedPayment.user_email);

      // Call the actual email API
      console.log('📡 Making API call to /api/emails/send...');
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: selectedPayment.user_email,
          template: {
            subject: template.subject,
            body: template.body
          },
          failedPaymentId: selectedPayment.id,
          templateName: 'Manual Email'
        })
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      console.log('✅ Email sent successfully:', result);
      console.log('✅ Email ID:', result.emailId);
      console.log('✅ Sequence ID:', result.sequenceId);
      
      // Show success message
      setEmailSuccess(`Email sent successfully to ${selectedPayment.user_email}!`);
      
      // Refresh the payments data
      console.log('🔄 Refreshing payments data...');
      await fetchPayments();
      console.log('✅ Payments data refreshed');
      
    } catch (err) {
      console.error('❌ Send email error:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to send email');
      // Reopen the modal on error
      setShowEmailModal(true);
    } finally {
      console.log('🏁 Email send process finished');
      setSendingEmail(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesSearch = payment.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.membership_id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      active: { 
        lightColor: 'bg-warning-100 text-warning-900', 
        darkColor: 'dark:bg-warning-100 dark:text-black',
        label: 'Active' 
      },
      recovered: { 
        lightColor: 'bg-success-100 text-success-800', 
        darkColor: 'dark:bg-success-100 dark:text-black',
        label: 'Recovered' 
      },
      cancelled: { 
        lightColor: 'bg-error-100 text-error-800', 
        darkColor: 'dark:bg-error-100 dark:text-black',
        label: 'Cancelled' 
      }
    };
    const config = configs[status as keyof typeof configs] || configs.active;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.lightColor} ${config.darkColor}`}>
        {config.label}
      </span>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading payments...</p>
        </div>
      </div>
    );
  }

  if (error) {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
			<div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPayments}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Payments
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Manage failed payments and recovery actions
              </p>
            </div>
            <Link
              href="/email-settings"
              className="inline-flex items-center px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Email Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {emailSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700 dark:text-green-300">{emailSuccess}</p>
              <button
                onClick={() => setEmailSuccess(null)}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Status tabs */}
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All', count: payments.length },
                { key: 'active', label: 'Active', count: payments.filter(p => p.status === 'active').length },
                { key: 'recovered', label: 'Recovered', count: payments.filter(p => p.status === 'recovered').length },
                { key: 'cancelled', label: 'Cancelled', count: payments.filter(p => p.status === 'cancelled').length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or membership ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRows.length > 0 && (
          <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-700 dark:text-brand-300">
                {selectedRows.length} payment{selectedRows.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleBulkAction('enable_auto_email')}
                  className="inline-flex items-center px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Enable Auto-Emails
                </button>
                <button 
                  onClick={() => handleBulkAction('disable_auto_email')}
                  className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Disable Auto-Emails
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      checked={selectedRows.length === filteredPayments.length && filteredPayments.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows(filteredPayments.map(p => p.id));
                        } else {
                          setSelectedRows([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Membership ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Failed Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Emails Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Auto-Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        checked={selectedRows.includes(payment.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, payment.id]);
                          } else {
                            setSelectedRows(selectedRows.filter(id => id !== payment.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {payment.user_email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs">
                          {payment.membership_id.substring(0, 12)}...
                        </span>
                        <button
                          onClick={() => copyToClipboard(payment.membership_id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                          title="Copy membership ID"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      ${(payment.amount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {payment.payments_failed_count}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {payment.emails_sent}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payment.last_email_sent)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          console.log('🔘 Auto-email toggle clicked for payment:', payment.id);
                          // TODO: Implement individual auto-email toggle
                          alert('Auto-email toggle not implemented yet. Use bulk actions for now.');
                        }}
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                        title={payment.auto_email_enabled ? "Disable auto-email" : "Enable auto-email"}
                      >
                        {payment.auto_email_enabled ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          console.log('🔘 Send Email button clicked for payment:', payment.id);
                          console.log('🔘 Payment data:', payment);
                          setSelectedPayment(payment);
                          setShowEmailModal(true);
                          console.log('🔘 Modal should be opening now');
                        }}
                        disabled={sendingEmail}
                        className="inline-flex items-center px-3 py-1 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingEmail ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1" />
                            Send Email
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No payments found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'No failed payments to display yet.'
              }
            </p>
          </div>
        )}

      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Send Email</h3>
            
            {/* Payment Info */}
            {selectedPayment && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <p className="text-gray-900 dark:text-white mb-2"><strong>To:</strong> {selectedPayment.user_email}</p>
                <p className="text-gray-900 dark:text-white mb-2"><strong>Amount:</strong> ${(selectedPayment.amount / 100).toFixed(2)}</p>
                <p className="text-gray-900 dark:text-white"><strong>Membership ID:</strong> {selectedPayment.membership_id.substring(0, 12)}...</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject Line:</label>
              <input 
                type="text" 
                defaultValue="Payment Failed - Action Required"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body:</label>
              <textarea 
                rows={6}
                placeholder="Email goes here..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-vertical"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('🔘 Send Email button clicked in modal');
                  alert('Email would be sent! (This is a test)');
                  setShowEmailModal(false);
                }}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDetailsModal(false)} />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Details</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedPayment.user_email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">${(selectedPayment.amount / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Membership ID</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{selectedPayment.membership_id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Failed Count</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedPayment.payments_failed_count}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Emails Sent</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{selectedPayment.emails_sent}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Email</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedPayment.last_email_sent)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedPayment.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Email Modal Component
function EmailModal({ onClose, onSendEmail, payment }: { onClose: () => void; onSendEmail: (template: any) => void; payment: Payment | null }) {
  const [template, setTemplate] = useState('First Reminder');
  const [subject, setSubject] = useState('Payment Failed - Action Required');
  const [body, setBody] = useState('Hi {{userName}},\n\nYour payment of ${{amount}} for {{productName}} has failed.\n\nPlease update your payment method: {{recoveryLink}}\n\nBest regards,\nDunningPro Team');

  const handleSend = () => {
    console.log('🔘 Email Modal Send button clicked');
    console.log('📧 Template data:', { subject, body });
    console.log('📧 Payment data:', payment);
    
    if (!payment) {
      console.error('❌ No payment data in modal');
      alert('Error: No payment selected. Please try again.');
      return;
    }
    
    try {
      onSendEmail({ subject, body });
    } catch (error) {
      console.error('❌ Error in handleSend:', error);
      alert('Error sending email: ' + error);
    }
  };

  const variables = [
    { name: 'userName', label: 'User Name' },
    { name: 'amount', label: 'Amount' },
    { name: 'productName', label: 'Product Name' },
    { name: 'recoveryLink', label: 'Recovery Link' }
  ];

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setBody(before + `{{${variable}}}` + after);
    }
  };

	return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Send Email</h3>
            
            {/* Payment Info */}
            {payment ? (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>To:</strong> {payment.user_email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Amount:</strong> ${(payment.amount / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Membership ID:</strong> {payment.membership_id.substring(0, 12)}...
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-300">
                  <strong>Error:</strong> No payment selected. Please close this modal and try again.
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option>First Reminder</option>
                  <option>Second Reminder</option>
                  <option>Final Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Body
                </label>
                <div className="mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Insert variables:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {variables.map((variable) => (
                      <button
                        key={variable.name}
                        onClick={() => insertVariable(variable.name)}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {variable.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              onClick={handleSend}
              disabled={!payment}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {payment ? 'Send Email' : 'No Payment Selected'}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
			</div>
		</div>
	);
}