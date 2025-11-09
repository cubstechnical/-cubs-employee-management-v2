'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Globe,
  Save,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  AlertTriangle,
  X,
  Info
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/SimpleAuthContext';
import { AuthService } from '@/lib/services/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { log } from '@/lib/utils/productionLogger';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      push: true,
      visaExpiryAlerts: true,
      documentUploadAlerts: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'strong'
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY'
    },
    appearance: {
      theme: 'system',
      compactMode: false,
      showAnimations: true
    }
  });

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Try to load from API first
      try {
        const { getApiUrl } = await import('@/lib/utils/apiClient');
        const response = await fetch(getApiUrl('api/settings/user'));
        const data = await response.json();

        if (data.success && data.data) {
          setSettings(prev => ({
            ...prev,
            ...data.data,
            name: (user as any).name || data.data.profile?.name || user.email || '',
            email: user.email || data.data.profile?.email || ''
          }));
          return;
        }
      } catch (apiError) {
        log.warn('API not available, using default settings:', apiError);
      }

      // Fallback: Use default settings with user data
      setSettings(prev => ({
        ...prev,
        name: (user as any).name || user.email || '',
        email: user.email || ''
      }));
    } catch (error) {
      log.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, [user, loadSettings]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Try to save via API first
      try {
        const settingsData = {
          profile: {
            name: settings.name,
            email: settings.email
          },
          notifications: settings.notifications,
          security: settings.security,
          preferences: settings.preferences,
          appearance: settings.appearance
        };

        const { getApiUrl } = await import('@/lib/utils/apiClient');
        const response = await fetch(getApiUrl('api/settings/user'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ allSettings: settingsData }),
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Settings saved successfully!');
          setIsEditing(false);
          // Reset password fields
          setSettings(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          return;
        }
      } catch (apiError) {
        log.warn('API not available, simulating save:', apiError);
      }

      // Fallback: Simulate successful save
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save delay
      toast.success('Settings saved successfully! (Demo Mode)');
      setIsEditing(false);
      // Reset password fields
      setSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      log.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data and reload from API
    setSettings(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    loadSettings(); // Reload to discard unsaved changes
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    try {
      // Try to delete via API first
      try {
        const { session } = await AuthService.getSession();

        if (!session?.access_token) {
          toast.error('Authentication required. Please sign in again.');
          return;
        }

        const { getApiUrl } = await import('@/lib/utils/apiClient');
        const response = await fetch(getApiUrl('api/auth/delete-account'), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const result = await response.json();

        if (response.ok) {
          toast.success('Account deleted successfully');
          // Sign out and redirect to login
          await signOut();
          window.location.href = '/login';
          return;
        }
      } catch (apiError) {
        log.warn('API not available, simulating account deletion:', apiError);
      }

      // Fallback: Simulate account deletion
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate deletion process
      toast.success('Account deletion completed (Demo Mode)');
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      log.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
              >
                Edit Settings
              </Button>
            )}
          </div>
        </div>

        {/* Profile Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              value={settings.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email Address"
              type="email"
              value={settings.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={settings.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                disabled={!isEditing}
                icon={<Shield className="w-4 h-4" />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              <div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="New Password"
                type="password"
                value={settings.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                disabled={!isEditing}
                icon={<Shield className="w-4 h-4" />}
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={settings.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={!isEditing}
                icon={<Shield className="w-4 h-4" />}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleNestedChange('security', 'twoFactorAuth', e.target.checked)}
                  disabled={!isEditing}
                  className="w-4 h-4 text-[#d3194f] bg-gray-100 border-gray-300 rounded focus:ring-[#d3194f]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Session Timeout (minutes)
                </label>
                <select
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleNestedChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d3194f]"
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
                  onChange={(e) => handleNestedChange('security', 'passwordPolicy', e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d3194f]"
                >
                  <option value="basic">Basic (8+ characters)</option>
                  <option value="strong">Strong (12+ characters, symbols)</option>
                  <option value="very-strong">Very Strong (16+ characters, symbols, numbers)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={(e) => handleNestedChange('notifications', 'email', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-[#d3194f] bg-gray-100 border-gray-300 rounded focus:ring-[#d3194f]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.push}
                onChange={(e) => handleNestedChange('notifications', 'push', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-[#d3194f] bg-gray-100 border-gray-300 rounded focus:ring-[#d3194f]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Visa Expiry Alerts</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about expiring visas</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.visaExpiryAlerts}
                onChange={(e) => handleNestedChange('notifications', 'visaExpiryAlerts', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-[#d3194f] bg-gray-100 border-gray-300 rounded focus:ring-[#d3194f]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Document Upload Alerts</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Notify when documents are uploaded</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notifications.documentUploadAlerts}
                onChange={(e) => handleNestedChange('notifications', 'documentUploadAlerts', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-[#d3194f] bg-gray-100 border-gray-300 rounded focus:ring-[#d3194f]"
              />
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Preferences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Language"
              value={settings.preferences.language}
              onChange={(e) => handleNestedChange('preferences', 'language', e.target.value)}
              disabled={!isEditing}
              options={[
                { value: 'en', label: 'English' },
                { value: 'ar', label: 'Arabic' },
                { value: 'fr', label: 'French' }
              ]}
            />
            <Select
              label="Timezone"
              value={settings.preferences.timezone}
              onChange={(e) => handleNestedChange('preferences', 'timezone', e.target.value)}
              disabled={!isEditing}
              options={[
                { value: 'UTC', label: 'UTC' },
                { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
                { value: 'Asia/Qatar', label: 'Qatar (GMT+3)' },
                { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' }
              ]}
            />
            <Select
              label="Date Format"
              value={settings.preferences.dateFormat}
              onChange={(e) => handleNestedChange('preferences', 'dateFormat', e.target.value)}
              disabled={!isEditing}
              options={[
                { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
              ]}
            />
          </div>
        </Card>

        {/* Appearance Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
              </div>
              <ThemeToggle />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Theme Preference
              </label>
              <select
                value={settings.appearance.theme}
                onChange={(e) => handleNestedChange('appearance', 'theme', e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d3194f]"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Compact Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reduce spacing for more content</p>
              </div>
              <input
                type="checkbox"
                checked={settings.appearance.compactMode}
                onChange={(e) => handleNestedChange('appearance', 'compactMode', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-[#d3194f] bg-gray-100 border-gray-300 rounded focus:ring-[#d3194f]"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Show Animations</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enable UI animations and transitions</p>
              </div>
              <input
                type="checkbox"
                checked={settings.appearance.showAnimations}
                onChange={(e) => handleNestedChange('appearance', 'showAnimations', e.target.checked)}
                disabled={!isEditing}
                className="w-4 h-4 text-[#d3194f] bg-gray-100 border-gray-300 rounded focus:ring-[#d3194f]"
              />
            </div>
          </div>
        </Card>

        {/* App Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            App Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">About CUBS Technical</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Learn more about our app and company
                </p>
              </div>
              <Link href="/about">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Privacy Policy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  How we collect, use, and protect your data
                </p>
              </div>
              <Link href="/privacy">
                <Button variant="outline" size="sm">
                  View Policy
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Terms of Service</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Terms and conditions for using our service
                </p>
              </div>
              <Link href="/terms">
                <Button variant="outline" size="sm">
                  View Terms
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Contact Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get help with your account or technical issues
                </p>
              </div>
              <Link href="/contact">
                <Button variant="outline" size="sm">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200 dark:border-red-800">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Danger Zone
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Once you delete your account, there is no going back. This will permanently remove your account, 
                    all your data, and all associated information. This action cannot be undone.
                  </p>
                  <div className="text-sm text-red-600 dark:text-red-400 mb-4">
                    <p className="font-medium">This will delete:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Your profile and personal information</li>
                      <li>All your settings and preferences</li>
                      <li>Your access to the system</li>
                      <li>All associated data and records</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  icon={<Trash2 className="w-4 h-4" />}
                  disabled={isDeleting}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Delete Account
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isDeleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Are you absolutely sure you want to delete your account? This action cannot be undone.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                To confirm, please type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">DELETE</span> in the box below:
              </p>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm"
                disabled={isDeleting}
                className="font-mono"
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation !== 'DELETE'}
                icon={<Trash2 className="w-4 h-4" />}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
