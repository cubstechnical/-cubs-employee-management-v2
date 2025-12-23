'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '@/components/layout/AuthenticatedLayout';
import { Bell, Mail, Clock, CheckCircle, XCircle, Users, Calendar, Settings, Send, RefreshCw, Eye, Search } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
// Note: Email services are called via API routes, not imported directly
import toast from 'react-hot-toast';
import { log } from '@/lib/utils/productionLogger';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  status: 'sent' | 'pending' | 'failed';
  recipient: string;
  createdAt: string;
  scheduledFor?: string;
  category: 'visa' | 'document' | 'system' | 'approval';
}

interface NotificationStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  today: number;
  thisWeek: number;
}

interface VisaStats {
  totalEmployees: number;
  expiringSoon: number;
  expired: number;
  notificationsSent: number;
}

import VisaRenewalModal from '@/components/notifications/VisaRenewalModal';

function NotificationsPageContent() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    today: 0,
    thisWeek: 0
  });
  const [visaStats, setVisaStats] = useState<VisaStats>({
    totalEmployees: 0,
    expiringSoon: 0,
    expired: 0,
    notificationsSent: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCheckingVisa, setIsCheckingVisa] = useState(false);
  const [selectedEmployeeForRenewal, setSelectedEmployeeForRenewal] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchExpiringEmployees = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Load notifications and stats
  useEffect(() => {
    loadNotifications();
  }, [currentPage, searchTerm, refreshTrigger]);

  useEffect(() => {
    loadStats(); // Use dedicated stats endpoint
    loadVisaStats();
  }, [refreshTrigger]);

  const loadStats = useCallback(async () => {
    try {
      log.info('Loading notification stats from API...');
      const { getApiUrl } = await import('@/lib/utils/apiClient');
      const response = await fetch(getApiUrl('api/notifications/stats'));
      const result = await response.json();

      if (result.success && result.stats) {
        const newStats: NotificationStats = {
          total: result.stats.total_count || 0,
          sent: result.stats.sent_count || 0,
          pending: result.stats.pending_count || 0,
          failed: result.stats.failed_count || 0,
          today: result.stats.today_count || 0,
          thisWeek: result.stats.week_count || 0
        };
        setStats(newStats);
        log.info('Notification stats loaded successfully:', newStats);
      } else {
        log.warn('No stats found or API error:', result.error);
        setStats({
          total: 0,
          sent: 0,
          pending: 0,
          failed: 0,
          today: 0,
          thisWeek: 0
        });
      }
    } catch (error) {
      log.error('Error loading notification stats:', error);
      setStats({
        total: 0,
        sent: 0,
        pending: 0,
        failed: 0,
        today: 0,
        thisWeek: 0
      });
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      log.info('Loading notifications from API...');

      // Load notifications from API - use getApiUrl for mobile compatibility
      const { getApiUrl } = await import('@/lib/utils/apiClient');
      const offset = (currentPage - 1) * limit;
      const queryParams = new URLSearchParams({
        search: searchTerm,
        limit: String(limit),
        offset: String(offset)
      });

      const response = await fetch(getApiUrl(`api/notifications?${queryParams.toString()}`));
      const result = await response.json();

      if (result.success && result.notifications) {
        // Transform API data to match our interface
        const transformedNotifications: Notification[] = result.notifications.map((n: any) => ({
          id: String(n.id),
          title: String(n.title),
          message: String(n.message),
          type: (n.type as 'success' | 'warning' | 'error' | 'info') || 'info',
          status: 'sent' as const, // Default status for API notifications
          recipient: String(n.user_id || 'system'),
          createdAt: String(n.created_at),
          category: (n.category as 'visa' | 'document' | 'system' | 'approval') || 'system'
        }));

        setNotifications(transformedNotifications);
        // Assuming the API might return total count in the future, for now we just show what we have
        // If your API returned a total count, you'd set it here.
        // For now, let's assume if we got a full page, there might be more
        setTotalCount(result.notifications.length === limit ? (currentPage * limit) + 1 : (currentPage - 1) * limit + result.notifications.length);

        log.info('Notifications loaded successfully:', { count: transformedNotifications.length });
      } else {
        log.warn('No notifications found or API error:', result.error);
        setNotifications([]);
        setTotalCount(0);
      }
    } catch (error) {
      log.error('Error loading notifications:', error);
      setNotifications([]);
      setStats({
        total: 0,
        sent: 0,
        pending: 0,
        failed: 0,
        today: 0,
        thisWeek: 0
      });
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, limit]);

  const loadVisaStats = useCallback(async () => {
    try {
      log.info('Loading visa statistics from API...');

      // Load visa stats from API - use getApiUrl for mobile compatibility
      const { getApiUrl } = await import('@/lib/utils/apiClient');
      const response = await fetch(getApiUrl('api/visa-notifications'));
      const result = await response.json();

      if (result.success && result.stats) {
        const newVisaStats: VisaStats = {
          totalEmployees: result.stats.total_tracked || 0,
          expiringSoon: result.stats.expiring_soon || 0,
          expired: result.stats.expired || 0,
          notificationsSent: 0 // This will be updated when notifications are sent
        };
        setVisaStats(newVisaStats);
        log.info('Visa statistics loaded successfully:', newVisaStats);
      } else {
        log.warn('No visa statistics found or API error:', result.error);
        setVisaStats({
          totalEmployees: 0,
          expiringSoon: 0,
          expired: 0,
          notificationsSent: 0
        });
      }
    } catch (error) {
      log.error('Error loading visa stats:', error);
      setVisaStats({
        totalEmployees: 0,
        expiringSoon: 0,
        expired: 0,
        notificationsSent: 0
      });
    }
  }, []);

  const sendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      log.info('Sending test email...');

      const { getApiUrl } = await import('@/lib/utils/apiClient');
      const response = await fetch(getApiUrl('api/send-email'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'info@cubstechnical.com',
          subject: 'CUBS Employee Management - Test Email',
          message: 'This is a test email to verify that the email notification system is working correctly. The system is now ready to send automated visa expiry notifications.',
          type: 'test'
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Test email sent successfully to info@cubstechnical.com');
        log.info('Test email sent successfully:', result.messageId);

        // Refresh notifications to show the new test email
        loadNotifications();
      } else {
        toast.error(`Failed to send test email: ${result.error}`);
        log.error('Test email failed:', result.error);
      }
    } catch (error) {
      log.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  const checkVisaExpiries = async () => {
    setIsCheckingVisa(true);
    try {
      log.info('Checking visa expiries and sending notifications...');

      const { getApiUrl } = await import('@/lib/utils/apiClient');
      const response = await fetch(getApiUrl('api/visa-notifications'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        const { notifications_sent, expiring_soon, expired, total_employees } = result.results;

        if (expiring_soon > 0 || expired > 0) {
          // Send push notification for visa expiries
          try {
            const { PushNotificationService } = await import('@/lib/services/pushNotifications');

            // Determine urgency based on expiring soon count
            let urgency: 'critical' | 'urgent' | 'high' | 'medium' | 'low' = 'medium';
            if (expired > 0) {
              urgency = 'critical';
            } else if (expiring_soon > 0) {
              // Check if any are expiring in 7 days or less
              const { getApiUrl } = await import('@/lib/utils/apiClient');
              const statsResponse = await fetch(getApiUrl('api/visa-notifications'));
              const statsResult = await statsResponse.json();

              if (statsResult.success && statsResult.stats) {
                // We'll use a general urgency for now
                urgency = 'high';
              }
            }

            const totalAffected = expiring_soon + expired;
            const daysRemaining = expired > 0 ? 0 : 7; // Use 7 as default for expiring soon

            await PushNotificationService.sendVisaExpiryNotification(
              totalAffected,
              daysRemaining,
              urgency
            );
          } catch (pushError) {
            log.warn('Failed to send push notification:', pushError);
            // Don't fail the whole operation if push fails
          }

          toast.success(`Visa expiry check completed! ${expiring_soon + expired} employee(s) need attention. Email sent to info@cubstechnical.com`);
        } else {
          toast.success('Visa expiry check completed. No notifications needed at this time.');
        }

        log.info('Visa expiry check completed:', {
          notifications_sent,
          expiring_soon,
          expired,
          total_employees
        });

        // Update visa stats with notification count
        setVisaStats(prev => ({
          ...prev,
          notificationsSent: notifications_sent || 0
        }));

        // Refresh both notifications and visa stats
        loadNotifications();
        loadVisaStats();
      } else {
        toast.error(`Failed to check visa expiries: ${result.error}`);
        log.error('Visa expiry check failed:', result.error);
      }
    } catch (error) {
      log.error('Error checking visa expiries:', error);
      toast.error('Failed to check visa expiries');
    } finally {
      setIsCheckingVisa(false);
    }
  };



  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'visa': return <Users className="w-4 h-4" />;
      case 'document': return <Mail className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      case 'approval': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage automated notifications and email alerts</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={sendTestEmail}
            disabled={isSendingTest}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSendingTest ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>
          <Button
            onClick={checkVisaExpiries}
            disabled={isCheckingVisa}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isCheckingVisa ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Check Visa Expiries
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sent Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.today}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Visa Expiry Stats */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Visa Expiry Statistics</h2>
          <Button
            onClick={loadVisaStats}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{visaStats.totalEmployees}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{visaStats.expiringSoon}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon (≤30 days)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{visaStats.expired}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{visaStats.notificationsSent}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Notifications Sent</p>
          </div>
        </div>
      </Card>

      {/* Email Service Status */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Service Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Gmail SMTP Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">From Email:</span>
                <span className="font-mono text-gray-900 dark:text-white">technicalcubs@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">To Email:</span>
                <span className="font-mono text-gray-900 dark:text-white">info@cubstechnical.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Service:</span>
                <span className="text-green-600 font-medium">Gmail SMTP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Rate Limits</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Daily Limit:</span>
                <span className="text-gray-900 dark:text-white">500 emails</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Per Second:</span>
                <span className="text-gray-900 dark:text-white">20 emails</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Required: Visa Renewals */}
      <ActionRequiredSection
        key={refreshTrigger}
        onRenew={(employee) => setSelectedEmployeeForRenewal(employee)}
      />

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notifications</h2>
            <span className="text-sm text-gray-500">Page {currentPage}</span>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm
                  ? "No results match your search."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getCategoryIcon(notification.category)}
                        <h3 className="font-medium text-gray-900 dark:text-white">{notification.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                          {notification.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>To: {notification.recipient}</span>
                        <span>•</span>
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                        {notification.scheduledFor && (
                          <>
                            <span>•</span>
                            <span>Scheduled: {new Date(notification.scheduledFor).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Show Renew button if it's a visa expiry notification */}
                      {notification.category === 'visa' && (notification.type === 'error' || notification.type === 'warning') && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            // Try to parse employee name from message to find them
                            // This is a bit of a hack, ideally notification should carry metadata
                            // For now, let's open a generic employee search or redirect
                            // Better yet, let's look at the Action Required Section below
                            document.getElementById('action-required-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}

                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={notifications.length < limit || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Visa Renewal Modal */}
      {selectedEmployeeForRenewal && (
        <VisaRenewalModal
          isOpen={!!selectedEmployeeForRenewal}
          onClose={() => setSelectedEmployeeForRenewal(null)}
          employee={selectedEmployeeForRenewal}
          onSuccess={() => {
            loadVisaStats(); // Refresh stats
            toast.success('Stats updated');
            // Refresh list if we had one
            fetchExpiringEmployees();
          }}
        />
      )}
    </div>
  );
}

// Helper component for the Action Required Section
function ActionRequiredSection({
  onRenew
}: {
  onRenew: (employee: any) => void
}) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const fetchExpiring = async () => {
    try {
      setLoading(true);

      // Use supabase client directly here for simplicity and speed
      const { supabase } = await import('@/lib/supabase/client');
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(now.getDate() + 30);

      const { data, error } = await supabase
        .from('employee_table')
        .select('employee_id, name, visa_expiry_date, company_name')
        .lte('visa_expiry_date', thirtyDays.toISOString())
        .eq('is_active', true)
        .order('visa_expiry_date', { ascending: true });

      if (data) {
        setEmployees((data as any[]).map((e: any) => ({
          id: e.employee_id,
          name: e.name,
          visa_expiry_date: e.visa_expiry_date,
          company_name: e.company_name
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiring();
  }, []);

  if (loading) return null;
  if (employees.length === 0) return null;

  return (
    <Card className="mb-8 border-l-4 border-l-orange-500" id="action-required-section">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-orange-50/50 dark:bg-orange-900/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-200">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Action Required: Visa Renewals</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {employees.length} employees have expired or expiring visas
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Expiry Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {employees.map((emp) => {
                const days = Math.ceil((new Date(emp.visa_expiry_date).getTime() - new Date().getTime()) / (86400000));
                const isExpired = days < 0;

                return (
                  <tr key={emp.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {emp.name}
                      <span className="block text-xs text-gray-500">{emp.id}</span>
                    </td>
                    <td className="px-6 py-4">{emp.company_name}</td>
                    <td className="px-6 py-4 font-mono">
                      {new Date(emp.visa_expiry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {isExpired ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Expired {Math.abs(days)} days ago
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Expires in {days} days
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        onClick={() => onRenew(emp)}
                      >
                        Renew
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function NotificationsPage() {
  return (
    <AuthenticatedLayout requireAuth={true}>
      <NotificationsPageContent />
    </AuthenticatedLayout>
  );
}
