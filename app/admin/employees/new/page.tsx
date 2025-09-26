'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Layout is now handled by the root layout
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Save, Loader2 } from 'lucide-react';
import { EmployeeService } from '@/lib/services/employees';
import toast from 'react-hot-toast';
import { log } from '@/lib/utils/productionLogger';

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
  leave_date?: string;
  wcc: string;
  lulu_wps_card: string;
  basic_salary: string;
  company_name: string;
  phone?: string;
  email?: string;
  address?: string;
  passport_number?: string;
  visa_number?: string;
  visa_type?: string;
  visa_status: string;
  date_of_birth?: string;
  join_date?: string;
  salary?: number;
  mobile_number?: string;
  home_phone_number?: string;
  email_id?: string;
  company_id?: string;
  status: string;
  is_active: boolean;
}

const initialFormData: FormData = {
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
  leave_date: '',
  wcc: '',
  lulu_wps_card: '',
  basic_salary: '',
  company_name: '',
  phone: '',
  email: '',
  address: '',
  passport_number: '',
  visa_number: '',
  visa_type: '',
  visa_status: 'active',
  date_of_birth: '',
  join_date: '',
  salary: 0,
  mobile_number: '',
  home_phone_number: '',
  email_id: '',
  company_id: '',
  status: 'active',
  is_active: true
};

export default function NewEmployee() {
  return (
      <NewEmployeeContent />
  );
}

function NewEmployeeContent() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [previewId, setPreviewId] = useState<string>('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const { companies: companyList } = await EmployeeService.getFilterOptions();
      
      // Filter out only unwanted companies, keep all active companies including CUBS
      const filteredCompanies = companyList.filter(company => {
        // Remove Company Documents (not a real company)
        if (company === 'Company Documents') return false;
        
        // Remove duplicate Fluid Engineering variations (keep only FLUID ENGINEERING)
        if (company === 'FLUID ENGINEERING SERVICES') return false;
        if (company === 'FLUID') return false;
        
        // Keep all other companies including CUBS, CUBS CONTRACTING, CUBS TECH, etc.
        return true;
      });
      
      // Remove any remaining duplicates
      const uniqueCompanies = [...new Set(filteredCompanies)];
      
      setCompanies(uniqueCompanies);
      setLoadingCompanies(false);
    } catch (error) {
      log.error('Error loading companies:', error);
      setLoadingCompanies(false);
    }
  };

  const generatePreviewId = useCallback(async () => {
    log.info('🔄 Generating preview ID for:', { company: formData.company_name, name: formData.name });
    if (formData.company_name && formData.name) {
      try {
        const id = await EmployeeService.generateEmployeeId(formData.company_name, formData.name);
        log.info('✅ Generated employee ID:', id);
        setPreviewId(id);
      } catch (error) {
        log.error('❌ Error generating preview ID:', error);
        setPreviewId('');
      }
    } else {
      log.info('⚠️ Missing company or name for ID generation');
      setPreviewId('');
    }
  }, [formData.company_name, formData.name]);

  useEffect(() => {
    generatePreviewId();
  }, [formData.company_name, formData.name, generatePreviewId]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Employee name is required';
    }

    if (!formData.company_name) {
      newErrors.company_name = 'Company is required';
    }

    if (!formData.trade.trim()) {
      newErrors.trade = 'Trade is required';
    }

    if (!formData.nationality.trim()) {
      newErrors.nationality = 'Nationality is required';
    }

    if (!formData.joining_date) {
      newErrors.joining_date = 'Joining date is required';
    }

    if (!formData.passport_no.trim()) {
      newErrors.passport_no = 'Passport number is required';
    }

    if (!formData.passport_expiry) {
      newErrors.passport_expiry = 'Passport expiry date is required';
    }

    if (!formData.labourcard_no.trim()) {
      newErrors.labourcard_no = 'Labour card number is required';
    }

    if (!formData.labourcard_expiry) {
      newErrors.labourcard_expiry = 'Labour card expiry date is required';
    }

    if (!formData.visa_expiry_date) {
      newErrors.visa_expiry_date = 'Visa expiry date is required';
    }

    if (!formData.basic_salary.trim()) {
      newErrors.basic_salary = 'Basic salary is required';
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
      const employeeData = {
        ...formData,
        employee_id: previewId,
        date_of_birth: formData.dob,
        mobile_number: formData.phone,
        email_id: formData.email
      };

      const { employee, error } = await EmployeeService.createEmployee(employeeData);

      if (error) {
        toast.error(error);
        return;
      }

      if (employee) {
        toast.success('Employee created successfully!');
        router.push('/employees');
      }
    } catch (error) {
      log.error('Error creating employee:', error);
      toast.error('Failed to create employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getFieldError = (field: string) => errors[field];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Employee</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create a new employee record with all required information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee ID Preview */}
        {previewId && (
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated Employee ID:</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{previewId}</span>
            </div>
          </Card>
        )}

        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter employee name"
                error={getFieldError('name')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  getFieldError('company_name') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={loadingCompanies}
              >
                <option value="">{loadingCompanies ? 'Loading companies...' : 'Select company'}</option>
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
              {getFieldError('company_name') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('company_name')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trade <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.trade}
                onChange={(e) => handleInputChange('trade', e.target.value)}
                placeholder="e.g., Electrician, Plumber"
                error={getFieldError('trade')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nationality <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                placeholder="e.g., Indian, Pakistani"
                error={getFieldError('nationality')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
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
                Basic Salary <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.basic_salary}
                onChange={(e) => handleInputChange('basic_salary', e.target.value)}
                placeholder="e.g., 1500"
                error={getFieldError('basic_salary')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+971-50-123-4567"
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
                placeholder="employee@example.com"
                error={getFieldError('email')}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <Input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter address"
                error={getFieldError('address')}
              />
            </div>
          </div>
        </Card>

        {/* Document Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Document Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passport Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.passport_no}
                onChange={(e) => handleInputChange('passport_no', e.target.value)}
                placeholder="e.g., A12345678"
                error={getFieldError('passport_no')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passport Expiry Date <span className="text-red-500">*</span>
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
                Labour Card Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.labourcard_no}
                onChange={(e) => handleInputChange('labourcard_no', e.target.value)}
                placeholder="e.g., 1234567890"
                error={getFieldError('labourcard_no')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Labour Card Expiry Date <span className="text-red-500">*</span>
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

        {/* Additional Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leave Date
              </label>
              <Input
                type="date"
                value={formData.leave_date || ''}
                onChange={(e) => handleInputChange('leave_date', e.target.value)}
                error={getFieldError('leave_date')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Passport Number (Alternative)
              </label>
              <Input
                type="text"
                value={formData.passport_number || ''}
                onChange={(e) => handleInputChange('passport_number', e.target.value)}
                placeholder="Alternative passport number"
                error={getFieldError('passport_number')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visa Number
              </label>
              <Input
                type="text"
                value={formData.visa_number || ''}
                onChange={(e) => handleInputChange('visa_number', e.target.value)}
                placeholder="Visa number"
                error={getFieldError('visa_number')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visa Type
              </label>
              <select
                value={formData.visa_type || ''}
                onChange={(e) => handleInputChange('visa_type', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  getFieldError('visa_type') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Select visa type</option>
                <option value="employment">Employment</option>
                <option value="visit">Visit</option>
                <option value="transit">Transit</option>
                <option value="tourist">Tourist</option>
              </select>
              {getFieldError('visa_type') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('visa_type')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visa Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.visa_status}
                onChange={(e) => handleInputChange('visa_status', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  getFieldError('visa_status') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
              {getFieldError('visa_status') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('visa_status')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth (Alternative)
              </label>
              <Input
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                error={getFieldError('date_of_birth')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Join Date (Alternative)
              </label>
              <Input
                type="date"
                value={formData.join_date || ''}
                onChange={(e) => handleInputChange('join_date', e.target.value)}
                error={getFieldError('join_date')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Salary (Numeric)
              </label>
              <Input
                type="number"
                value={formData.salary || ''}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                placeholder="1500"
                error={getFieldError('salary')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number (Alternative)
              </label>
              <Input
                type="tel"
                value={formData.mobile_number || ''}
                onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                placeholder="+971-50-123-4567"
                error={getFieldError('mobile_number')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Home Phone Number
              </label>
              <Input
                type="tel"
                value={formData.home_phone_number || ''}
                onChange={(e) => handleInputChange('home_phone_number', e.target.value)}
                placeholder="+971-4-123-4567"
                error={getFieldError('home_phone_number')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email ID (Alternative)
              </label>
              <Input
                type="email"
                value={formData.email_id || ''}
                onChange={(e) => handleInputChange('email_id', e.target.value)}
                placeholder="employee@example.com"
                error={getFieldError('email_id')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company ID
              </label>
              <Input
                type="text"
                value={formData.company_id || ''}
                onChange={(e) => handleInputChange('company_id', e.target.value)}
                placeholder="Company ID"
                error={getFieldError('company_id')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  getFieldError('status') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="on_leave">On Leave</option>
              </select>
              {getFieldError('status') && (
                <p className="text-red-500 text-sm mt-1">{getFieldError('status')}</p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Is Active
                </span>
              </label>
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
  );
} 
 
 