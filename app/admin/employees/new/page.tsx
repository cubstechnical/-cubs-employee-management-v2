'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { EmployeeService } from '@/lib/services/employees';
import { 
  User, 
  Building, 
  Calendar, 
  CreditCard, 
  FileText, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Briefcase,
  DollarSign,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FormData {
  name: string;
  dob: string;
  trade: string;
  nationality: string;
  joining_date: string;
  passport_no: string;
  passport_expiry: string;
  labourcard_no: string;
  labourcard_expiry: string;
  visastamping_date: string;
  visa_expiry_date: string;
  eid: string;
  wcc: string;
  lulu_wps_card: string;
  basic_salary: string;
  company_name: string;
  phone?: string;
  email?: string;
  address?: string;
}

const REQUIRED_FIELDS = [
  'name', 'dob', 'trade', 'nationality', 'joining_date', 
  'passport_no', 'passport_expiry', 'visa_expiry_date', 
  'basic_salary', 'company_name'
];

const COMPANY_OPTIONS = [
  'AL HANA TOURS & TRAVELS',
  'Other Company 1',
  'Other Company 2'
];

const TRADE_OPTIONS = [
  'Driver',
  'Office Assistant',
  'Manager',
  'Technician',
  'Sales Executive',
  'Accountant',
  'Cleaner',
  'Security Guard',
  'Other'
];

const NATIONALITY_OPTIONS = [
  'Indian',
  'Pakistani',
  'Bangladeshi',
  'Filipino',
  'Nepalese',
  'Sri Lankan',
  'Egyptian',
  'Sudanese',
  'Other'
];

export default function NewEmployee() {
  return (
    <ProtectedRoute>
      <NewEmployeeContent />
    </ProtectedRoute>
  );
}

function NewEmployeeContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState(false);
  const [previewId, setPreviewId] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    dob: '',
    trade: '',
    nationality: '',
    joining_date: '',
    passport_no: '',
    passport_expiry: '',
    labourcard_no: '',
    labourcard_expiry: '',
    visastamping_date: '',
    visa_expiry_date: '',
    eid: '',
    wcc: '',
    lulu_wps_card: '',
    basic_salary: '',
    company_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Generate preview employee ID when name and company change
  useEffect(() => {
    const generatePreviewId = async () => {
      if (formData.name && formData.company_name) {
        setGeneratingId(true);
        try {
          const id = await EmployeeService.generateEmployeeId(formData.company_name, formData.name);
          setPreviewId(id);
        } catch (error) {
          console.error('Error generating preview ID:', error);
        } finally {
          setGeneratingId(false);
        }
      } else {
        setPreviewId('');
      }
    };

    const debounceTimer = setTimeout(generatePreviewId, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.name, formData.company_name]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Check required fields
    REQUIRED_FIELDS.forEach(field => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Validate email format
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone format
    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{7,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate dates
    const today = new Date();
    if (formData.dob && new Date(formData.dob) > today) {
      newErrors.dob = 'Date of birth cannot be in the future';
    }

    if (formData.passport_expiry && new Date(formData.passport_expiry) < today) {
      newErrors.passport_expiry = 'Passport expiry date should be in the future';
    }

    if (formData.visa_expiry_date && new Date(formData.visa_expiry_date) < today) {
      newErrors.visa_expiry_date = 'Visa expiry date should be in the future';
    }

    // Validate salary
    if (formData.basic_salary && (isNaN(Number(formData.basic_salary)) || Number(formData.basic_salary) <= 0)) {
      newErrors.basic_salary = 'Please enter a valid salary amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      // Generate final employee ID
      const employee_id = await EmployeeService.generateEmployeeId(formData.company_name, formData.name);
      
      const employeeData = {
        employee_id,
        ...formData,
        status: 'active',
        is_active: true
      };

      const { success, error } = await EmployeeService.createEmployee(employeeData);
      
      if (success) {
        toast.success('Employee created successfully!');
        router.push('/admin/employees');
      } else {
        toast.error(error || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getFieldError = (field: string) => errors[field];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Employee</h1>
              <p className="text-gray-600 dark:text-gray-400">Create a new employee record</p>
            </div>
          </div>
        </div>

        {/* Employee ID Preview */}
        {(formData.name || formData.company_name) && (
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Generated Employee ID</p>
                <div className="flex items-center space-x-2">
                  {generatingId ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-blue-700 dark:text-blue-300">Generating...</span>
                    </div>
                  ) : previewId ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-lg font-mono font-bold text-blue-800 dark:text-blue-200">{previewId}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Enter name and company to generate ID</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Basic personal details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  error={getFieldError('name')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  error={getFieldError('dob')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nationality <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select nationality</option>
                  {NATIONALITY_OPTIONS.map(nationality => (
                    <option key={nationality} value={nationality}>{nationality}</option>
                  ))}
                </select>
                {getFieldError('nationality') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('nationality')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+971 50 123 4567"
                  error={getFieldError('phone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="employee@company.com"
                  error={getFieldError('email')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <Input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Full address"
                  error={getFieldError('address')}
                />
              </div>
            </div>
          </Card>

          {/* Employment Information */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Employment Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Job and company details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select company</option>
                  {COMPANY_OPTIONS.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
                {getFieldError('company_name') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('company_name')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trade/Position <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.trade}
                  onChange={(e) => handleInputChange('trade', e.target.value)}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select trade</option>
                  {TRADE_OPTIONS.map(trade => (
                    <option key={trade} value={trade}>{trade}</option>
                  ))}
                </select>
                {getFieldError('trade') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('trade')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Joining Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => handleInputChange('joining_date', e.target.value)}
                  error={getFieldError('joining_date')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Basic Salary (AED) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.basic_salary}
                  onChange={(e) => handleInputChange('basic_salary', e.target.value)}
                  placeholder="3000"
                  min="0"
                  step="100"
                  error={getFieldError('basic_salary')}
                />
              </div>
            </div>
          </Card>

          {/* Document Information */}
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Document Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passport, visa, and other documents</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passport Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.passport_no}
                  onChange={(e) => handleInputChange('passport_no', e.target.value)}
                  placeholder="A1234567"
                  error={getFieldError('passport_no')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passport Expiry <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.passport_expiry}
                  onChange={(e) => handleInputChange('passport_expiry', e.target.value)}
                  error={getFieldError('passport_expiry')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Labour Card Number
                </label>
                <Input
                  type="text"
                  value={formData.labourcard_no}
                  onChange={(e) => handleInputChange('labourcard_no', e.target.value)}
                  placeholder="LC123456"
                  error={getFieldError('labourcard_no')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Labour Card Expiry
                </label>
                <Input
                  type="date"
                  value={formData.labourcard_expiry}
                  onChange={(e) => handleInputChange('labourcard_expiry', e.target.value)}
                  error={getFieldError('labourcard_expiry')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visa Stamping Date
                </label>
                <Input
                  type="date"
                  value={formData.visastamping_date}
                  onChange={(e) => handleInputChange('visastamping_date', e.target.value)}
                  error={getFieldError('visastamping_date')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visa Expiry Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.visa_expiry_date}
                  onChange={(e) => handleInputChange('visa_expiry_date', e.target.value)}
                  error={getFieldError('visa_expiry_date')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Emirates ID
                </label>
                <Input
                  type="text"
                  value={formData.eid}
                  onChange={(e) => handleInputChange('eid', e.target.value)}
                  placeholder="784-1234-1234567-1"
                  error={getFieldError('eid')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  WCC Number
                </label>
                <Input
                  type="text"
                  value={formData.wcc}
                  onChange={(e) => handleInputChange('wcc', e.target.value)}
                  placeholder="WCC123456"
                  error={getFieldError('wcc')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lulu WPS Card
                </label>
                <Input
                  type="text"
                  value={formData.lulu_wps_card}
                  onChange={(e) => handleInputChange('lulu_wps_card', e.target.value)}
                  placeholder="WPS123456"
                  error={getFieldError('lulu_wps_card')}
                />
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Employee...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Create Employee</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}