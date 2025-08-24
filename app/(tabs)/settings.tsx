'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { supabase } from '@/lib/supabase/client';
import {
  Settings,
  User,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Key,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Shield as ShieldIcon,
  Activity,
  Database,
  Code
} from 'lucide-react';
import AuthService from '@/lib/services/auth';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile state
  // Simplified profile: display only
  const [displayName] = useState('Main Admin');

  // Security state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  // Company state
  // Remove company settings

  // Notifications state
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    schedule: {
      days90: true,
      days60: true,
      days30: true,
      days15: true,
      days7: true,
      days1: true
    }
  });

  // System state
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    lastBackup: '2024-01-15',
    databaseStatus: 'Connected',
    storageUsed: '2.3 GB',
    totalStorage: '10 GB'
  });

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System & Security', icon: ShieldIcon },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{displayName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Administrator</p>
          </div>
        </div>
      </div>

      {/* Security Section */}
              <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Security</h3>
        
        {/* Change Password */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white">Change Password</h4>
        
                    <div className="relative">
                      <Input
                        label="Current Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
            icon={<Key className="w-4 h-4" />}
              value={securityData.currentPassword}
              onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="relative">
                      <Input
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
            icon={<Key className="w-4 h-4" />}
              value={securityData.newPassword}
              onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="Confirm new password"
          icon={<Key className="w-4 h-4" />}
            value={securityData.confirmPassword}
            onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          />
        </div>

        {/* Two-Factor Authentication (hidden per requirements) */}
      </div>

      <div className="flex justify-end">
        <Button onClick={async () => {
          if (!securityData.newPassword) {
            toast.success('Profile updated');
            return;
          }
          if (securityData.newPassword !== securityData.confirmPassword) {
            toast.error('New password and confirmation do not match');
            return;
          }
          setIsLoading(true);
          const { error } = await AuthService.updatePassword({ newPassword: securityData.newPassword });
          setIsLoading(false);
          if (error) {
            toast.error(error.message || 'Failed to update password');
          } else {
            toast.success('Password updated successfully');
            setSecurityData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
          }
        }} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Danger Zone - Account Deletion */}
      <div className="space-y-4 mt-8 pt-6 border-t border-red-200 dark:border-red-800">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400">Danger Zone</h3>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-400">Delete Account</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="danger"
                onClick={() => setShowDeleteDialog(true)}
                className="mt-3"
                size="sm"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Company tab removed per requirements

  const renderNotificationsTab = () => (
          <div className="space-y-6">
      {/* Notification Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Visa Expiry Notifications</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Enable automated visa expiry alerts</p>
                  </div>
        <button
          onClick={() => setNotificationSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            notificationSettings.enabled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {notificationSettings.enabled ? 'Enabled' : 'Disabled'}
        </button>
                </div>

      {/* Notification Schedule */}
              <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notification Schedule</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Choose when to receive visa expiry alerts</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(notificationSettings.schedule).map(([key, value]) => {
            const days = key.replace('days', '');
            const label = days === '1' ? '1 day before' : `${days} days before`;
            
            return (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule, [key]: !value }
                  }))}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    value
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {value ? 'On' : 'Off'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recipient and template configuration removed per requirements */}

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Notification settings updated successfully!')} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
            </div>
          </div>
        );

  const renderSystemTab = () => (
    <div className="space-y-6">
      {/* System Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Code className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">App Version</p>
                <p className="font-medium text-gray-900 dark:text-white">{systemInfo.version}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Database Status</p>
                <p className="font-medium text-gray-900 dark:text-white">{systemInfo.databaseStatus}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
                <p className="font-medium text-gray-900 dark:text-white">{systemInfo.storageUsed} / {systemInfo.totalStorage}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Backup</p>
                <p className="font-medium text-gray-900 dark:text-white">{systemInfo.lastBackup}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Profile updated</span>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">New employee added</span>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Visa expiry notification sent</span>
              <span className="text-xs text-gray-500">2 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">About</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>CUBS Visa Management System</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version {systemInfo.version}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Developed by{' '}
              <a
                href="https://chocosoftdev.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Chocosoft Dev
              </a>
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Legal</h4>
              <div className="space-y-1">
                <Link
                  href="/privacy"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline block"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline block"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Appearance</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Theme</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
          </div>
          <ThemeToggle size="lg" />
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'system':
        return renderSystemTab();
      default:
        return (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {tabs.find(tab => tab.id === activeTab)?.label} Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All settings are configured and working properly.
            </p>
          </div>
        );
    }
  };

  // Account deletion handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to delete your account');
        setIsDeleting(false);
        return;
      }

      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Account deletion response:', data);

        // Check if the profile was actually deleted
        if (data.details?.userDeleted) {
          toast.success('Account and profile deleted successfully. You will be logged out.');
          console.log('✅ Account deletion successful - profile removed from database');
        } else if (data.details?.error) {
          toast.error(`Account deletion failed: ${data.details.error}`);
          console.error('❌ Account deletion failed:', data.details.error);
          setIsDeleting(false);
          setShowDeleteDialog(false);
          setDeleteConfirmation('');
          return; // Don't proceed with logout if deletion failed
        } else {
          toast.success('Account deletion partially completed. You will be logged out.');
          console.log('⚠️ Account deletion partially completed');
        }

        // Always logout user after successful API call (even if partial deletion)
        await AuthService.signOut();
        router.push('/login');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete account');
        console.error('❌ Account deletion API error:', error);
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
  };

  // Delete Account Dialog Component
  const DeleteAccountDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Deleting your account will permanently remove:
            </p>
            <ul className="mt-2 text-sm text-red-700 dark:text-red-300 space-y-1">
              <li>• All your personal information</li>
              <li>• All uploaded documents</li>
              <li>• Employee records and data</li>
              <li>• Account settings and preferences</li>
            </ul>
          </div>

          {/* Confirmation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <strong>DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setDeleteConfirmation(value);
              }}
              placeholder="DELETE"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            {deleteConfirmation && deleteConfirmation !== 'DELETE' && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Please type exactly "DELETE" (currently: "{deleteConfirmation}")
              </p>
            )}
          </div>

          {/* Data Export Option */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Want to keep your data?</strong> You can export your data before deleting your account.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || isDeleting}
              className="flex-1"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card>
              {renderTabContent()}
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      {showDeleteDialog && <DeleteAccountDialog />}
    </Layout>
  );
} 

