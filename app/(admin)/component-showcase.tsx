'use client';

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Sidebar from '@/components/layout/Sidebar';
import { useTheme } from '@/lib/theme';
import { toast } from 'react-hot-toast';
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Star,
  Heart,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Users,
  FileText,
  Folder,
  Trash2,
  Edit,
  Eye,
  Plus,
  Minus
} from 'lucide-react';

interface ComponentSection {
  id: string;
  title: string;
  description: string;
  expanded: boolean;
}

export default function ComponentShowcase() {
  const { theme } = useTheme();
  const [sections, setSections] = useState<ComponentSection[]>([
    { id: 'buttons', title: 'Buttons', description: 'All button variants and states', expanded: true },
    { id: 'inputs', title: 'Input Fields', description: 'Text inputs, selects, and date pickers', expanded: true },
    { id: 'cards', title: 'Cards', description: 'Content containers and layouts', expanded: true },
    { id: 'navigation', title: 'Navigation', description: 'Sidebar and navigation components', expanded: true },
    { id: 'feedback', title: 'Feedback', description: 'Toasts, alerts, and status indicators', expanded: true },
    { id: 'icons', title: 'Icons', description: 'Lucide React icon collection', expanded: true },
    { id: 'layout', title: 'Layout', description: 'Grid systems and spacing', expanded: true },
    { id: 'theme', title: 'Theme System', description: 'Dark/light mode and color palette', expanded: true }
  ]);

  const [formData, setFormData] = useState({
    text: '',
    email: '',
    select: '',
    date: null as Date | null,
    textarea: ''
  });

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(section =>
      section.id === id ? { ...section, expanded: !section.expanded } : section
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Form submitted successfully!');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Component Showcase</h1>
            <p className="text-muted-foreground text-lg">
              A comprehensive collection of all UI components in the Apple Design System
            </p>
            <div className="flex items-center gap-4 mt-4">
              <ThemeToggle />
              <span className="text-sm text-muted-foreground">
                Current theme: {theme}
              </span>
            </div>
          </div>

          {/* Component Sections */}
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.id} className="border-border/50">
                <div
                  className="cursor-pointer hover:bg-muted/50 transition-colors p-6 border-b border-border/50"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{section.title}</h2>
                      <p className="text-muted-foreground mt-1">{section.description}</p>
                    </div>
                    {section.expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {section.expanded && (
                  <div className="p-6">
                    {section.id === 'buttons' && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Button Variants</h3>
                        <div className="flex flex-wrap gap-4">
                          <Button variant="primary">Primary Button</Button>
                          <Button variant="secondary">Secondary Button</Button>
                          <Button variant="outline">Outline Button</Button>
                          <Button variant="ghost">Ghost Button</Button>
                          <Button variant="danger">Danger Button</Button>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Button Sizes</h3>
                          <div className="flex flex-wrap items-center gap-4">
                            <Button size="sm">Small</Button>
                            <Button size="md">Medium</Button>
                            <Button size="lg">Large</Button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Button States</h3>
                          <div className="flex flex-wrap gap-4">
                            <Button disabled>Disabled</Button>
                            <Button loading>Loading</Button>
                            <Button>
                              <Plus size={16} className="mr-2" />
                              With Icon
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {section.id === 'inputs' && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Text Inputs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Text Input"
                            placeholder="Enter text..."
                            value={formData.text}
                            onChange={(e) => handleInputChange('text', e.target.value)}
                          />
                          <Input
                            label="Email Input"
                            type="email"
                            placeholder="Enter email..."
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                          <Input
                            label="Input with Error"
                            placeholder="Error state"
                            error="This field is required"
                          />
                          <Input
                            label="Disabled Input"
                            placeholder="Disabled"
                            disabled
                          />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Select Dropdown</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                              label="Select Option"
                              placeholder="Choose an option"
                              value={formData.select}
                              onChange={(value) => handleInputChange('select', value)}
                              options={[
                                { value: 'option1', label: 'Option 1' },
                                { value: 'option2', label: 'Option 2' },
                                { value: 'option3', label: 'Option 3' }
                              ]}
                            />
                            <Select
                              label="Select with Icon"
                              placeholder="Choose an option"
                              icon={<Building size={16} />}
                              options={[
                                { value: 'company1', label: 'CUBS Technical' },
                                { value: 'company2', label: 'GOLDEN CUBS' }
                              ]}
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Date Picker</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DatePicker
                              label="Date Picker"
                              placeholder="Select date"
                              value={formData.date}
                              onChange={(date) => handleInputChange('date', date)}
                            />
                            <DatePicker
                              label="Date with Min/Max"
                              placeholder="Select date"
                              minDate={new Date()}
                              maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {section.id === 'cards' && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Card Variants</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <Card>
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold">Basic Card</h3>
                            </div>
                            <p className="text-muted-foreground">
                              This is a basic card with header and content.
                            </p>
                          </Card>

                          <Card>
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <User size={24} className="text-primary" />
                                <h3 className="font-semibold">User Profile</h3>
                                <p className="text-sm text-muted-foreground">Active user</p>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                  <Star size={20} className="text-yellow-500" />
                                  Featured
                                </h3>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-4">
                              A card with an icon in the title.
                            </p>
                            <Button size="sm">Action</Button>
                          </Card>
                        </div>
                      </>
                    )}

                    {section.id === 'navigation' && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Navigation Components</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-lg font-semibold">Sidebar Preview</h3>
                            <p>
                              The sidebar is visible on the left side of this page.
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                                Dashboard
                                <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                                Employees
                                <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                                Documents
                              </div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">Breadcrumbs</h3>
                            <nav className="flex items-center space-x-2 text-sm">
                              <span className="text-muted-foreground">Home</span>
                              <ChevronRight size={16} className="text-muted-foreground" />
                              <span className="text-muted-foreground">Admin</span>
                              <ChevronRight size={16} className="text-muted-foreground" />
                              <span className="text-foreground">Components</span>
                            </nav>
                          </div>
                        </div>
                      </>
                    )}

                    {section.id === 'feedback' && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <CheckCircle size={20} className="text-green-600" />
                            <span className="text-green-700 dark:text-green-400">Success</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <Info size={20} className="text-blue-600" />
                            <span className="text-blue-700 dark:text-blue-400">Info</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                            <AlertCircle size={20} className="text-yellow-600" />
                            <span className="text-yellow-700 dark:text-yellow-400">Warning</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <XCircle size={20} className="text-red-600" />
                            <span className="text-red-700 dark:text-red-400">Error</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Toast Notifications</h3>
                          <div className="flex flex-wrap gap-4">
                            <Button
                              size="sm"
                              onClick={() => toast.success('Success message!')}
                            >
                              Success Toast
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => toast.error('Error message!')}
                            >
                              Error Toast
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => toast('Info message!')}
                            >
                              Info Toast
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {section.id === 'icons' && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Common Icons</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {[
                            { icon: User, name: 'User' },
                            { icon: Mail, name: 'Mail' },
                            { icon: Phone, name: 'Phone' },
                            { icon: Calendar, name: 'Calendar' },
                            { icon: MapPin, name: 'Location' },
                            { icon: Building, name: 'Building' },
                            { icon: Users, name: 'Users' },
                            { icon: FileText, name: 'File' },
                            { icon: Folder, name: 'Folder' },
                            { icon: Search, name: 'Search' },
                            { icon: Filter, name: 'Filter' },
                            { icon: Settings, name: 'Settings' },
                            { icon: Edit, name: 'Edit' },
                            { icon: Eye, name: 'View' },
                            { icon: Trash2, name: 'Delete' },
                            { icon: Download, name: 'Download' },
                            { icon: Upload, name: 'Upload' },
                            { icon: Plus, name: 'Add' },
                            { icon: Minus, name: 'Remove' },
                            { icon: Check, name: 'Check' },
                            { icon: Copy, name: 'Copy' },
                            { icon: Star, name: 'Star' },
                            { icon: Heart, name: 'Heart' }
                          ].map(({ icon: Icon, name }) => (
                            <div
                              key={name}
                              className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => copyToClipboard(`<${name} size={16} />`)}
                            >
                              <Icon size={24} className="text-foreground" />
                              <span className="text-xs text-muted-foreground text-center">{name}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {section.id === 'layout' && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Grid System</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-20 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-medium"
                            >
                              Col {i + 1}
                            </div>
                          ))}
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Spacing Scale</h3>
                          <div className="space-y-4">
                            {[1, 2, 3, 4, 6, 8, 12, 16].map((space) => (
                              <div key={space} className="flex items-center gap-4">
                                <div className="w-16 text-sm font-mono text-muted-foreground">
                                  {space}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {space * 0.25}rem
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {section.id === 'theme' && (
                      <>
                        <h3 className="text-lg font-semibold mb-4">Color Palette</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { name: 'Primary', class: 'bg-primary', text: 'text-primary-foreground' },
                            { name: 'Secondary', class: 'bg-secondary', text: 'text-secondary-foreground' },
                            { name: 'Muted', class: 'bg-muted', text: 'text-muted-foreground' },
                            { name: 'Accent', class: 'bg-accent', text: 'text-accent-foreground' },
                            { name: 'Background', class: 'bg-background border border-border' },
                            { name: 'Foreground', class: 'bg-foreground', text: 'text-background' },
                            { name: 'Card', class: 'bg-card border border-border' },
                            { name: 'Border', class: 'bg-border' }
                          ].map(({ name, class: className, text }) => (
                            <div key={name} className="space-y-2">
                              <div className={`h-16 rounded-lg ${className} ${text || ''} flex items-center justify-center font-medium`}>
                                {name}
                              </div>
                              <p className="text-xs text-muted-foreground text-center">{name}</p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Typography</h3>
                          <div className="space-y-2">
                            <h1 className="text-4xl font-bold">Heading 1 (4xl)</h1>
                            <p className="text-sm text-muted-foreground">font-bold, text-4xl</p>
                            <h2 className="text-3xl font-semibold">Heading 2 (3xl)</h2>
                            <p className="text-sm text-muted-foreground">font-semibold, text-3xl</p>
                            <h3 className="text-2xl font-semibold">Heading 3 (2xl)</h3>
                            <p className="text-sm text-muted-foreground">font-semibold, text-2xl</p>
                            <h4 className="text-xl font-semibold">Heading 4 (xl)</h4>
                            <p className="text-sm text-muted-foreground">font-semibold, text-xl</p>
                            <p className="text-lg">Body Large (lg)</p>
                            <p className="text-sm text-muted-foreground">text-lg</p>
                            <p className="text-base">Body (base)</p>
                            <p className="text-sm text-muted-foreground">text-base</p>
                            <p className="text-sm">Body Small (sm)</p>
                            <p className="text-sm text-muted-foreground">text-sm</p>
                            <p className="text-xs">Caption (xs)</p>
                            <p className="text-sm text-muted-foreground">text-xs</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Interactive Form Demo */}
          <Card className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Interactive Form Demo</h2>
              <p className="text-muted-foreground">
                Test all form components working together
              </p>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.text}
                  onChange={(e) => handleInputChange('text', e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground mb-1">
                  Company
                </label>
                <Select
                  label="Select company"
                  value={formData.select}
                  onChange={(value) => handleInputChange('select', value)}
                  options={[
                    { value: 'cubs', label: 'CUBS Technical' },
                    { value: 'golden', label: 'GOLDEN CUBS' }
                  ]}
                />
              </div>
              <div>
                <label htmlFor="joinDate" className="block text-sm font-medium text-foreground mb-1">
                  Join Date
                </label>
                <DatePicker
                  label="Join Date"
                  value={formData.date}
                  onChange={(date) => handleInputChange('date', date)}
                />
              </div>
              <div>
                <Button type="submit">Submit Form</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({ text: '', email: '', select: '', date: null, textarea: '' })}
                >
                  Reset Form
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
} 