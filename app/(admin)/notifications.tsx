'use client';

import { useState, useEffect } from 'react';
import { Bell, Filter, Search, Eye, Trash2, CheckCircle, AlertTriangle, Info, Clock, User, Building2, Archive } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'employee' | 'visa' | 'document' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  recipient_id?: string;
  recipient_name?: string;
  company_name?: string;
  created_at: string;
  read_at?: string;
  action_required: boolean;
  action_url?: string;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Visa Expiry Alert',
    message: 'Employee John Doe (EMP001) visa expires in 15 days',
    type: 'warning',
    category: 'visa',
    priority: 'high',
    status: 'unread',
    recipient_id: 'EMP001',
    recipient_name: 'John Doe',
    company_name: 'CUBS Technical',
    created_at: '2024-01-15T10:30:00Z',
    action_required: true,
    action_url: '/employees/EMP001'
  },
  {
    id: '2',
    title: 'Document Upload Required',
    message: 'New employee Sarah Smith needs passport copy uploaded',
    type: 'info',
    category: 'document',
    priority: 'medium',
    status: 'unread',
    recipient_id: 'EMP002',
    recipient_name: 'Sarah Smith',
    company_name: 'GOLDEN CUBS',
    created_at: '2024-01-15T09:15:00Z',
    action_required: true,
    action_url: '/employees/EMP002'
  },
  {
    id: '3',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on January 20th, 2024 from 2:00 AM to 4:00 AM',
    type: 'info',
    category: 'system',
    priority: 'low',
    status: 'read',
    created_at: '2024-01-14T16:00:00Z',
    action_required: false
  },
  {
    id: '4',
    title: 'New Employee Added',
    message: 'Employee Michael Johnson has been successfully added to the system',
    type: 'success',
    category: 'employee',
    priority: 'medium',
    status: 'read',
    recipient_id: 'EMP003',
    recipient_name: 'Michael Johnson',
    company_name: 'CUBS Technical',
    created_at: '2024-01-14T14:30:00Z',
    action_required: false
  },
  {
    id: '5',
    title: 'Critical Visa Expiry',
    message: 'Employee Lisa Wang (EMP004) visa expires in 7 days - URGENT ACTION REQUIRED',
    type: 'error',
    category: 'visa',
    priority: 'urgent',
    status: 'unread',
    recipient_id: 'EMP004',
    recipient_name: 'Lisa Wang',
    company_name: 'GOLDEN CUBS',
    created_at: '2024-01-15T08:00:00Z',
    action_required: true,
    action_url: '/employees/EMP004'
  }
];

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'system', label: 'System' },
  { value: 'employee', label: 'Employee' },
  { value: 'visa', label: 'Visa' },
  { value: 'document', label: 'Document' },
  { value: 'general', label: 'General' }
];

const priorityOptions = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Archived' }
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(mockNotifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  // Filter notifications based on search and filters
  useEffect(() => {
    let filtered = notifications;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.recipient_name?.toLowerCase().includes(searchLower) ||
        notification.company_name?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(notification => notification.category === selectedCategory);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(notification => notification.priority === selectedPriority);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(notification => notification.status === selectedStatus);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, selectedCategory, selectedPriority, selectedStatus]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (priority) {
      case 'urgent':
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`}>Urgent</span>;
      case 'high':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400`}>High</span>;
      case 'medium':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`}>Medium</span>;
      case 'low':
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`}>Low</span>;
      default:
        return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (category) {
      case 'visa':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400`}>Visa</span>;
      case 'document':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}>Document</span>;
      case 'employee':
        return <span className={`${baseClasses} bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400`}>Employee</span>;
      case 'system':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>System</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400`}>General</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const markAsRead = async (notificationId: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, status: 'read', read_at: new Date().toISOString() }
          : notification
      ));
      
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    } finally {
      setLoading(false);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      setNotifications(prev => prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, status: 'archived' }
          : notification
      ));
      toast.success('Notification archived');
    } catch (error) {
      toast.error('Failed to archive notification');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      setNotifications(prev => prev.map(notification =>
        notification.status === 'unread'
          ? { ...notification, status: 'read' }
          : notification
      ));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && n.status === 'unread').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage system notifications and alerts</p>
          </div>
          <div className="flex items-center space-x-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                disabled={loading}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{unreadCount}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{urgentCount}</p>
              </div>
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
          
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Archived</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {notifications.filter(n => n.status === 'archived').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            
            <Select
              placeholder="Category"
              options={categoryOptions}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            />
            
            <Select
              placeholder="Priority"
              options={priorityOptions}
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            />
            
            <Select
              placeholder="Status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
        </Card>

        {/* Notifications List */}
        <Card>
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg ${
                    notification.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-medium ${
                            notification.status === 'unread' 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          {notification.action_required && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded-full">
                              Action Required
                            </span>
                          )}
                          {getPriorityBadge(notification.priority)}
                          {getCategoryBadge(notification.category)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(notification.created_at)}
                          </span>
                          {notification.recipient_name && (
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {notification.recipient_name}
                            </span>
                          )}
                          {notification.company_name && (
                            <span>{notification.company_name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {notification.status === 'unread' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          disabled={loading}
                          icon={<CheckCircle className="w-4 h-4" />}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark Read
                        </Button>
                      )}
                      {notification.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archiveNotification(notification.id)}
                          disabled={loading}
                          icon={<Archive className="w-4 h-4" />}
                          className="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Archive
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        disabled={loading}
                        icon={<Trash2 className="w-4 h-4" />}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
} 

