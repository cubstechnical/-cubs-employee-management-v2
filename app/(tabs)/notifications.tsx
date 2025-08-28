'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Filter,
  Search,
  Mail,
  Settings
} from 'lucide-react';
import { formatDate, timeAgo } from '@/utils/date';
import { EmployeeService } from '@/lib/services/employees';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  category: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  timestamp: string;
  employee_id?: string;
}

// Keep some system notifications as mock data
const systemNotifications: Notification[] = [
  {
    id: 4,
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight at 2 AM EST.',
    type: 'info',
    category: 'system',
    priority: 'low',
    read: true,
    timestamp: '2024-01-14T15:00:00Z',
  },
  {
    id: 6,
    title: 'Email Sent Successfully',
    message: 'Visa expiry reminder email has been sent to 5 employees.',
    type: 'success',
    category: 'email',
    priority: 'low',
    read: true,
    timestamp: '2024-01-14T11:00:00Z',
  },
];

const categories = ['All', 'visa', 'document', 'employee', 'system', 'approval', 'email'];
const priorities = ['All', 'high', 'medium', 'low'];

function NotificationCard({ notification, onMarkRead, onDelete }: { 
  notification: any; 
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 dark:border-l-red-400';
      case 'medium': return 'border-l-orange-500 dark:border-l-orange-400';
      case 'low': return 'border-l-blue-500 dark:border-l-blue-400';
      default: return 'border-l-gray-300 dark:border-l-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'visa': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'document': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'employee': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'system': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'approval': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'email': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  return (
    <Card className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getTypeIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {notification.title}
                </h3>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {notification.message}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                <span className={`px-2 py-1 rounded-full ${getCategoryColor(notification.category)}`}>
                  {notification.category}
                </span>
                <span>{timeAgo(notification.timestamp)}</span>
                <span className="capitalize">{notification.priority} priority</span>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkRead(notification.id)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Mark Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showRead, setShowRead] = useState(true);

  // Function to generate visa expiry notifications
  const generateVisaNotifications = (employees: any[]): Notification[] => {
    const visaNotifications: Notification[] = [];
    let notificationId = 1000; // Start with high ID to avoid conflicts

    employees.forEach(employee => {
      if (employee.visa_expiry_date) {
        const expiryDate = new Date(employee.visa_expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Only show notifications for visas expiring in the next 90 days
        if (daysUntilExpiry <= 90 && daysUntilExpiry >= 0) {
          let priority: 'high' | 'medium' | 'low' = 'low';
          let type: 'warning' | 'error' | 'info' = 'info';
          
          if (daysUntilExpiry <= 15) {
            priority = 'high';
            type = 'error';
          } else if (daysUntilExpiry <= 30) {
            priority = 'high';
            type = 'warning';
          } else if (daysUntilExpiry <= 60) {
            priority = 'medium';
            type = 'warning';
          }

          visaNotifications.push({
            id: notificationId++,
            title: 'Visa Expiry Alert',
            message: `${employee.name}'s visa expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} (${formatDate(employee.visa_expiry_date)}).`,
            type,
            category: 'visa',
            priority,
            read: false,
            timestamp: new Date().toISOString(),
            employee_id: employee.employee_id
          });
        }
      }

      // Check passport expiry
      if (employee.passport_expiry) {
        const expiryDate = new Date(employee.passport_expiry);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry <= 180 && daysUntilExpiry >= 0) {
          let priority: 'high' | 'medium' | 'low' = 'low';
          let type: 'warning' | 'error' | 'info' = 'info';
          
          if (daysUntilExpiry <= 30) {
            priority = 'high';
            type = 'warning';
          } else if (daysUntilExpiry <= 90) {
            priority = 'medium';
            type = 'warning';
          }

          visaNotifications.push({
            id: notificationId++,
            title: 'Passport Expiry Alert',
            message: `${employee.name}'s passport expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} (${formatDate(employee.passport_expiry)}).`,
            type,
            category: 'document',
            priority,
            read: false,
            timestamp: new Date().toISOString(),
            employee_id: employee.employee_id
          });
        }
      }
    });

    return visaNotifications;
  };

  // Fetch visa notifications on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        
        // Fetch employees with expiry dates
        const { employees, error } = await EmployeeService.getEmployees(
          { page: 1, pageSize: 1000 }, // Get all employees
          { is_temporary: false } // Only regular employees
        );

        if (error) {
          console.error('Error fetching employees:', error);
          toast.error('Failed to load visa notifications');
          setNotifications(systemNotifications);
          return;
        }

        // Generate visa notifications from employee data
        const visaNotifications = generateVisaNotifications(employees);
        
        // Combine with system notifications
        const allNotifications = [...visaNotifications, ...systemNotifications].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setNotifications(allNotifications);
      } catch (error) {
        console.error('Error in fetchNotifications:', error);
        toast.error('Failed to load notifications');
        setNotifications(systemNotifications);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    const matchesCategory = selectedCategory === 'All' || notification.category === selectedCategory;
    const matchesPriority = selectedPriority === 'All' || notification.priority === selectedPriority;
    const matchesRead = showRead || !notification.read;
    return matchesCategory && matchesPriority && matchesRead;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleDelete = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Stay updated with important alerts and updates.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
            <Button variant="outline" onClick={markAllRead}>
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{unreadCount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => n.priority === 'high').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => {
                    const today = new Date().toDateString();
                    const notificationDate = new Date(n.timestamp).toDateString();
                    return today === notificationDate;
                  }).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:focus:border-primary-400 dark:focus:ring-primary-400/20"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="block w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:focus:border-primary-400 dark:focus:ring-primary-400/20"
            >
              {priorities.map(priority => (
                <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
              ))}
            </select>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showRead}
                onChange={(e) => setShowRead(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-400 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Show Read</span>
            </label>
          </div>
        </Card>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <Card className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading notifications...</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Checking for visa expiry alerts and system notifications.
              </p>
            </Card>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <Card className="p-12 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                You&apos;re all caught up! No new notifications to display.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
} 

