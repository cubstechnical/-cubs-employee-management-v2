'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
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
                href="https://chocosoft.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                Chocosoft Dev
              </a>
            </p>
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
              This section is under development.
            </p>
          </div>
        );
    }
  };

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
    </Layout>
  );
} 

