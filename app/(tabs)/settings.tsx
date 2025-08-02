'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Mail, 
  Database, 
  Palette,
  Save,
  Eye,
  EyeOff,
  Key,
  Globe,
  Smartphone
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'email', label: 'Email Settings', icon: Mail },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <User className="w-10 h-10 text-gray-500" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Picture</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new profile picture</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="First Name" placeholder="Enter your first name" />
        <Input label="Last Name" placeholder="Enter your last name" />
        <Input label="Email" type="email" placeholder="Enter your email" />
        <Input label="Phone" placeholder="Enter your phone number" />
        <Input label="Company" placeholder="Enter your company name" />
        <Input label="Position" placeholder="Enter your position" />
      </div>

      <div className="flex justify-end">
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h3>
        
        <div className="relative">
          <Input
            label="Current Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter current password"
            icon={<Key className="w-4 h-4" />}
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
        />
      </div>

      <div className="flex justify-end">
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Update Password
        </Button>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Theme</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
        </div>
        <ThemeToggle size="lg" />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Language</h3>
        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>

      <div className="flex justify-end">
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'security':
        return renderSecurityTab();
      case 'appearance':
        return renderAppearanceTab();
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

