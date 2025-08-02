'use client';

import { useState } from 'react';
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

// Mock data
const mockNotifications = [
  {
    id: 1,
    title: 'Visa Expiry Alert',
    message: 'John Smith\'s H-1B visa expires in 15 days. Please take action.',
    type: 'warning',
    category: 'visa',
    priority: 'high',
    read: false,
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    id: 2,
    title: 'Document Upload Required',
    message: 'New employee Sarah Johnson needs passport copy uploaded.',
    type: 'info',
    category: 'document',
    priority: 'medium',
    read: false,
    timestamp: '2024-01-15T09:15:00Z',
  },
  {
    id: 3,
    title: 'Employee Approval Pending',
    message: 'Manager approval required for new hire Michael Brown.',
    type: 'info',
    category: 'approval',
    priority: 'medium',
    read: true,
    timestamp: '2024-01-14T16:45:00Z',
  },
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
    id: 5,
    title: 'Visa Renewal Completed',
    message: 'Lisa Davis\'s L-1A visa renewal has been approved.',
    type: 'success',
    category: 'visa',
    priority: 'medium',
    read: false,
    timestamp: '2024-01-14T14:30:00Z',
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
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showRead, setShowRead] = useState(true);

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
          {filteredNotifications.length > 0 ? (
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
                You're all caught up! No new notifications to display.
              </p>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
} 

