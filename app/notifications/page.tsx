'use client';


import { useState, useEffect } from 'react';
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

export default function NotificationsPage() {
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
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCheckingVisa, setIsCheckingVisa] = useState(false);

  // Load notifications and stats
  useEffect(() => {
    loadNotifications();
    loadVisaStats();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      log.info('Loading notifications from API...');
      
      // Load notifications from API
      const response = await fetch('/api/notifications');
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

        // Calculate stats from real data
        const today = new Date().toDateString();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const newStats: NotificationStats = {
          total: transformedNotifications.length,
          sent: transformedNotifications.filter(n => n.status === 'sent').length,
          pending: transformedNotifications.filter(n => n.status === 'pending').length,
          failed: transformedNotifications.filter(n => n.status === 'failed').length,
          today: transformedNotifications.filter(n => new Date(n.createdAt).toDateString() === today).length,
          thisWeek: transformedNotifications.filter(n => new Date(n.createdAt) >= weekAgo).length
        };

        setStats(newStats);
        log.info('Notifications loaded successfully:', { count: transformedNotifications.length });
      } else {
        log.warn('No notifications found or API error:', result.error);
        setNotifications([]);
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
  };

  const loadVisaStats = async () => {
    try {
      log.info('Loading visa statistics from API...');
      
      // Load visa stats from API
      const response = await fetch('/api/visa-notifications');
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
  };

  const sendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      log.info('Sending test email...');
      
      const response = await fetch('/api/send-email', {
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
      
      const response = await fetch('/api/visa-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        const { notifications_sent, expiring_soon, expired, total_employees } = result.results;
        
        if (notifications_sent > 0) {
          toast.success(`Visa expiry check completed! ${notifications_sent} notifications sent to info@cubstechnical.com`);
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
          notificationsSent: notifications_sent
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

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || notification.type === filterType;
    const matchesStatus = !filterStatus || notification.status === filterStatus;
    const matchesCategory = !filterCategory || notification.category === filterCategory;
    return matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

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
          <div className="flex gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="info">Info</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="visa">Visa</option>
              <option value="document">Document</option>
              <option value="system">System</option>
              <option value="approval">Approval</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Notifications</h2>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {notifications.length === 0 
                  ? "No notifications have been created yet. The notifications table may not exist in the database."
                  : "No notifications match your current filters."
                }
              </p>
              {notifications.length === 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Setup Required:</strong> Run the database migration to create the notifications table and start tracking notifications.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
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
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
