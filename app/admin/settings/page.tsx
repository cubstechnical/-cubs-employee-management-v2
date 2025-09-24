'use client';

import { useState, useEffect, useCallback } from 'react';
// Layout is now handled by the root layout
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Settings, 
  Save,
  Bell,
  Shield,
  Database,
  Mail,
  Globe,
  User,
  Lock,
  Palette,
  Info,
  ExternalLink
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      visaExpiryAlerts: true,
      documentUploadAlerts: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'strong',
    },
    system: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      showAnimations: true,
    }
  });

  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/settings/admin');
      const data = await response.json();
      
      if (data.success && data.data) {
        // Map the API response to our settings state
        const loadedSettings = {
          notifications: data.data.notifications?.value || settings.notifications,
          security: data.data.security?.value || settings.security,
          system: data.data.system?.value || settings.system,
          appearance: data.data.appearance?.value || settings.appearance,
        };
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
      // Keep default settings on error
    } finally {
      setIsLoading(false);
    }
  }, [settings.appearance, settings.notifications, settings.security, settings.system]);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare settings data for API
      const settingsData = {
        notifications: {
          settingValue: settings.notifications,
          settingType: 'notifications',
          description: 'System notification settings',
          isPublic: true
        },
        security: {
          settingValue: settings.security,
          settingType: 'security',
          description: 'System security settings',
          isPublic: true
        },
        system: {
          settingValue: settings.system,
          settingType: 'system',
          description: 'System configuration settings',
          isPublic: false
        },
        appearance: {
          settingValue: settings.appearance,
          settingType: 'appearance',
          description: 'System appearance settings',
          isPublic: true
        }
      };

      const response = await fetch('/api/settings/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allSettings: settingsData }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Show success message using toast instead of alert
        if (typeof window !== 'undefined') {
          alert('Settings saved successfully!');
        }
      } else {
        alert(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure system settings and preferences
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Notifications */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Email Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.emailNotifications}
                  onChange={(e) => updateSetting('notifications', 'emailNotifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Push Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receive browser notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.pushNotifications}
                  onChange={(e) => updateSetting('notifications', 'pushNotifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Visa Expiry Alerts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about expiring visas</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.visaExpiryAlerts}
                  onChange={(e) => updateSetting('notifications', 'visaExpiryAlerts', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Document Upload Alerts</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notify when documents are uploaded</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.documentUploadAlerts}
                  onChange={(e) => updateSetting('notifications', 'documentUploadAlerts', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Session Timeout (minutes)
                </label>
                <select
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Password Policy
                </label>
                <select
                  value={settings.security.passwordPolicy}
                  onChange={(e) => updateSetting('security', 'passwordPolicy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basic">Basic (8+ characters)</option>
                  <option value="strong">Strong (12+ characters, symbols)</option>
                  <option value="very-strong">Very Strong (16+ characters, symbols, numbers)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* System */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <Database className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Auto Backup</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automatically backup data</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.system.autoBackup}
                  onChange={(e) => updateSetting('system', 'autoBackup', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Backup Frequency
                </label>
                <select
                  value={settings.system.backupFrequency}
                  onChange={(e) => updateSetting('system', 'backupFrequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Retention Period (days)
                </label>
                <Input
                  type="number"
                  value={settings.system.retentionDays.toString()}
                  onChange={(e) => updateSetting('system', 'retentionDays', parseInt(e.target.value))}
                  min="1"
                  max="365"
                />
              </div>
            </div>
          </Card>

          {/* Appearance */}
          <Card>
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Theme
                </label>
                <select
                  value={settings.appearance.theme}
                  onChange={(e) => updateSetting('appearance', 'theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Compact Mode</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reduce spacing for more content</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.appearance.compactMode}
                  onChange={(e) => updateSetting('appearance', 'compactMode', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Show Animations</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enable UI animations and transitions</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.appearance.showAnimations}
                  onChange={(e) => updateSetting('appearance', 'showAnimations', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* About Section */}
        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <Info className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Logo size="sm" showText={false} />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">CUBS Technical</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Employee Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Developer</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Built with ❤️ by ChocoSoft Dev</p>
              </div>
              <a
                href="https://chocosoftdev.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <span className="text-sm font-medium">Visit Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Employee Management System v1.0.0
            </div>
          </div>
        </Card>
      </div>
  );
} 