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
  Building,
  Bell,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  FileText,
  Mail,
  Clock,
  Users,
  Globe,
  Lock,
  Shield as ShieldIcon,
  Activity,
  Database,
  Code
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profileImage: null as File | null
  });

  // Security state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  // Company state
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    defaultDepartment: '',
    logo: null as File | null
  });

  // Notifications state
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    primaryEmail: '',
    schedule: {
      days90: true,
      days60: true,
      days30: true,
      days15: true,
      days7: true,
      days1: true
    },
    emailTemplate: ''
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
    { id: 'company', label: 'Company', icon: Building },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System & Security', icon: ShieldIcon },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Picture Section */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
            {profileData.profileImage ? (
              <img 
                src={URL.createObjectURL(profileData.profileImage)} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-gray-500" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Picture</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload a new photo</p>
        </div>
      </div>

      {/* Profile Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="First Name" 
            placeholder="Enter your first name"
            value={profileData.firstName}
            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
          />
          <Input 
            label="Last Name" 
            placeholder="Enter your last name"
            value={profileData.lastName}
            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
          />
          <Input 
            label="Email" 
            type="email" 
            placeholder="Enter your email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
          />
          <Input 
            label="Phone" 
            placeholder="Enter your phone number"
            value={profileData.phone}
            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
          />
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

        {/* Two-Factor Authentication */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
          </div>
          <button
            onClick={() => setSecurityData(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              securityData.twoFactorEnabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {securityData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Profile updated successfully!')} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

  const renderCompanyTab = () => (
    <div className="space-y-6">
      {/* Company Logo Section */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {companyData.logo ? (
              <img 
                src={URL.createObjectURL(companyData.logo)} 
                alt="Company Logo" 
                className="w-full h-full object-cover"
              />
            ) : (
              <Building className="w-10 h-10 text-gray-500" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors">
            <Upload className="w-4 h-4" />
          </button>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Company Logo</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Upload your company logo</p>
        </div>
      </div>

      {/* Company Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Company Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Company Name" 
            placeholder="Enter company name"
            value={companyData.name}
            onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
          />
          <Input 
            label="Phone" 
            placeholder="Enter company phone"
            value={companyData.phone}
            onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
          />
          <Input 
            label="Email" 
            type="email" 
            placeholder="Enter company email"
            value={companyData.email}
            onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
          />
          <Input 
            label="Website" 
            placeholder="Enter company website"
            value={companyData.website}
            onChange={(e) => setCompanyData(prev => ({ ...prev, website: e.target.value }))}
          />
        </div>
        <Input 
          label="Address" 
          placeholder="Enter company address"
          value={companyData.address}
          onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
        />
      </div>

      {/* Default Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Default Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Department
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={companyData.defaultDepartment}
              onChange={(e) => setCompanyData(prev => ({ ...prev, defaultDepartment: e.target.value }))}
            >
              <option value="">Select Department</option>
              <option value="HR">Human Resources</option>
              <option value="IT">Information Technology</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Company settings updated successfully!')} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );

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

      {/* Recipient Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recipient Configuration</h3>
        <Input 
          label="Primary Email Address" 
          type="email" 
          placeholder="hr@company.com"
          value={notificationSettings.primaryEmail}
          onChange={(e) => setNotificationSettings(prev => ({ ...prev, primaryEmail: e.target.value }))}
          icon={<Mail className="w-4 h-4" />}
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All visa expiry notifications will be sent to this email address
        </p>
      </div>

      {/* Email Template */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Template</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom Email Message
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Dear HR Team,&#10;&#10;This is a reminder that {employee_name}'s visa expires on {expiry_date}. Please take necessary action.&#10;&#10;Best regards,&#10;CUBS Visa Management System"
            value={notificationSettings.emailTemplate}
            onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailTemplate: e.target.value }))}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Use {'{employee_name}'} and {'{expiry_date}'} as placeholders
          </p>
        </div>
      </div>

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
      case 'company':
        return renderCompanyTab();
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

