'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/badge/Badge';
import { 
  Bell, 
  Mail, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Search,
  Filter,
  Send,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  status: 'sent' | 'pending' | 'failed';
  recipient: string;
  createdAt: string;
  scheduledFor?: string;
}

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Visa Expiry Reminder',
      message: 'Employee John Doe\'s visa expires in 30 days',
      type: 'warning',
      status: 'sent',
      recipient: 'hr@cubstechnical.com',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Document Upload Required',
      message: 'Please upload passport copy for employee Jane Smith',
      type: 'info',
      status: 'pending',
      recipient: 'admin@cubstechnical.com',
      createdAt: '2024-01-15T11:00:00Z'
    },
    {
      id: '3',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2-4 AM',
      type: 'info',
      status: 'sent',
      recipient: 'all@cubstechnical.com',
      createdAt: '2024-01-15T09:00:00Z',
      scheduledFor: '2024-01-16T02:00:00Z'
    },
    {
      id: '4',
      title: 'Failed Email Delivery',
      message: 'Unable to deliver notification to invalid@email.com',
      type: 'error',
      status: 'failed',
      recipient: 'invalid@email.com',
      createdAt: '2024-01-15T08:45:00Z'
    }
  ]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || notification.type === filterType;
    const matchesStatus = !filterStatus || notification.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'primary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'primary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage system notifications and alerts
            </p>
          </div>
          <Button icon={<Send className="w-4 h-4" />}>
            Send Notification
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                label="Search Notifications"
                placeholder="Search by title, message, or recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div>
              <Select
                label="Filter by Type"
                placeholder="All Types"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'info', label: 'Info' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'error', label: 'Error' },
                  { value: 'success', label: 'Success' }
                ]}
              />
            </div>
            <div>
              <Select
                label="Filter by Status"
                placeholder="All Statuses"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'failed', label: 'Failed' }
                ]}
              />
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('');
                  setFilterStatus('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Notifications
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => n.status === 'sent').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sent
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => n.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {notifications.filter(n => n.status === 'failed').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Failed
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="p-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getTypeIcon(notification.type)}
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <Badge color={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                      <Badge color={getStatusColor(notification.status)}>
                        {notification.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{notification.recipient}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                      {notification.scheduledFor && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled: {new Date(notification.scheduledFor).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search criteria or send a new notification.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
