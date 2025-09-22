'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { Skeleton } from '@/components/ui/Skeleton';
import Badge from '@/components/ui/badge/Badge';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/ui/Logo';
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Bell, 
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ComponentShowcase() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleButtonClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            CUBS Component Showcase
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore all available UI components in the CUBS Employee Management System
          </p>
        </div>

        {/* Buttons Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Buttons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button disabled>Disabled Button</Button>
            <Button loading={isLoading} onClick={handleButtonClick}>
              Loading Button
            </Button>
            <Button size="sm">Small Button</Button>
            <Button size="lg">Large Button</Button>
          </div>
        </Card>

        {/* Form Components Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Form Components
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                icon={<Mail className="w-4 h-4" />}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                icon={<User className="w-4 h-4" />}
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
              <Select
                label="Select Option"
                placeholder="Choose an option"
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
              <DatePicker
                label="Select Date"
                placeholder="Choose a date"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Input
                </label>
                <Input
                  placeholder="Search..."
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File Upload
                </label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" icon={<Upload className="w-4 h-4" />}>
                    Upload File
                  </Button>
                  <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Badges and Status Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Badges & Status
          </h2>
          <div className="flex flex-wrap gap-4">
            <Badge color="primary">Primary</Badge>
            <Badge color="info">Info</Badge>
            <Badge color="error">Error</Badge>
            <Badge color="warning">Warning</Badge>
            <Badge color="success">Success</Badge>
          </div>
        </Card>

        {/* Loading States Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Loading States
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Skeleton Loaders
              </h3>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Spinner
              </h3>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#d3194f]"></div>
                <span className="text-gray-600 dark:text-gray-400">Loading...</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Icons Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Icons
          </h2>
          <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4">
            {[
              User, Mail, Calendar, Settings, Bell, Search,
              Download, Upload, Edit, Trash2, Eye, EyeOff
            ].map((Icon, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Icon.name}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Theme Toggle */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Theme Controls
          </h2>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <span className="text-gray-600 dark:text-gray-400">
              Toggle between light and dark themes
            </span>
          </div>
        </Card>

        {/* Logo Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Branding
          </h2>
          <div className="flex items-center space-x-8">
            <Logo />
            <div className="text-gray-600 dark:text-gray-400">
              <p className="font-medium">CUBS Technical</p>
              <p className="text-sm">Employee Management System</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
